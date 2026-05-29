import type { z } from 'zod';

import { createSeededRandom, type RandomSource } from './random.js';
import { difficultyEnum, directionEnum, mapEnum } from './schemas.js';

type Difficulty = z.infer<typeof difficultyEnum>;
type MapId = z.infer<typeof mapEnum>;
type Direction = z.infer<typeof directionEnum>;

export interface GameReplayInput {
	difficulty: Difficulty;
	map: MapId;
	seed: number;
	tickCount: number;
	inputs: Array<{ tick: number; direction: Direction }>;
}

export interface GameReplayResult {
	gameOver: boolean;
	score: number;
	tickCount: number;
	elapsedMs: number;
}

interface Position {
	x: number;
	y: number;
}

type AppleType = 'classic' | 'shrink' | 'turbo' | 'chill' | 'ghost' | 'golden' | 'rotten';
type SpawnableAppleType = Exclude<AppleType, 'rotten'>;
type GameStatus = 'playing' | 'gameOver';
type GameEventType = 'bonusChain' | 'goldRush' | 'iceAge';
type GatePhase = 'closed' | 'open' | 'warning';

interface ActiveEffect {
	type: 'turbo' | 'chill' | 'ghost';
	startedAt: number;
	durationMs: number;
	expiresAt: number;
}

interface Apple {
	id: string;
	type: AppleType;
	position: Position;
	spawnedAt: number;
	expiresAt: number | null;
	rottenLifetimeMs?: number;
	source?: 'greedinessGate';
}

interface BonusChainState {
	steps: SpawnableAppleType[];
	currentIndex: number;
	startedAt: number;
}

interface PinnedBodyState {
	pinnedAt: Position;
	pinnedBody: Position[];
	allowedCells: Position[];
	penaltyRatio: number;
}

interface GameMapLayout {
	wallCells: Position[];
	appleBlockedCells: Position[];
	portals: Array<{ position: Position; pairedPosition: Position }>;
	greedinessGates: {
		chamberCells: Position[];
		gateCells: Position[];
		goldenApplePositions: Position[];
		closedMs: number;
		openMs: number;
		warningMs: number;
		cycleMs: number;
	} | null;
}

const DIFFICULTIES: Record<
	Difficulty,
	{ mapWidth: number; mapHeight: number; tickMs: number; specialAppleLifetimeMs: number }
> = {
	easy: { mapWidth: 24, mapHeight: 24, tickMs: 190, specialAppleLifetimeMs: 9000 },
	normal: { mapWidth: 20, mapHeight: 20, tickMs: 150, specialAppleLifetimeMs: 7500 },
	hard: { mapWidth: 16, mapHeight: 16, tickMs: 110, specialAppleLifetimeMs: 6000 },
	asian: { mapWidth: 14, mapHeight: 14, tickMs: 80, specialAppleLifetimeMs: 4500 }
};

const MAX_APPLES_BY_DIFFICULTY: Record<Difficulty, number> = {
	easy: 3,
	normal: 3,
	hard: 2,
	asian: 2
};
const APPLE_SPAWN_WEIGHTS: Record<SpawnableAppleType, number> = {
	classic: 60,
	shrink: 10,
	turbo: 10,
	chill: 8,
	ghost: 5,
	golden: 7
};
const MAX_SPECIAL_APPLES = 1;
const ROTTEN_APPLE_LIFETIME_MS = 3000;
const BONUS_CHAIN_LENGTH = 4;
const BONUS_CHAIN_MAX_DUPLICATE_PER_TYPE = 2;
const GAME_EVENT_TRIGGER_MIN_MS = 15_000;
const GAME_EVENT_TRIGGER_MAX_MS = 20_000;
const GAME_EVENT_TRIGGER_CHANCE = 0.05;
const GAME_EVENT_TRIGGER_WEIGHTS: Record<GameEventType, number> = {
	bonusChain: 4,
	goldRush: 1,
	iceAge: 4
};
const GOLD_RUSH_DURATION_MS = 10_000;
const GOLD_RUSH_SPECIAL_LIFETIME_MULTIPLIER = 0.4;
const GOLD_RUSH_ROTTEN_LIFETIME_MULTIPLIER = 1.5;
const ICE_AGE_DURATION_MS = 12_000;
const GREEDINESS_GATE_CLOSED_MS = 4_000;
const GREEDINESS_GATE_OPEN_MS = 6_500;
const GREEDINESS_GATE_WARNING_MS = 2_500;
const GREEDINESS_GATE_MAX_CUT_PENALTY_RATIO = 0.7;
const BASE_POINTS = 20;
const BONUS_CHAIN_COMPLETION_BONUS = BASE_POINTS * BONUS_CHAIN_LENGTH;
const MIN_SNAKE_LENGTH = 3;
const STARTING_SNAKE_LENGTH = 3;
const MIN_POINTS_MULTIPLIER = 0.25;
const MAX_POINTS_MULTIPLIER = 3.0;
const TURBO_DURATION_MS = 5000;
const TURBO_SPEED_MULTIPLIER = 1.35;
const TURBO_POINTS_DELTA = 0.5;
const CHILL_DURATION_MS = 5000;
const CHILL_SPEED_MULTIPLIER = 0.7;
const CHILL_POINTS_DELTA = -0.25;
const GHOST_DURATION_MS = 4500;
const SHRINK_LENGTH_DELTA = -1;
const CLASSIC_LENGTH_DELTA = 1;
const GOLDEN_SCORE_MULTIPLIER = 2;

export function replayGame(input: GameReplayInput): GameReplayResult {
	const engine = new ReplayEngine(input.difficulty, input.map, input.seed);
	return engine.run(input.tickCount, input.inputs);
}

class ReplayEngine {
	private readonly random: RandomSource;
	private readonly config: (typeof DIFFICULTIES)[Difficulty];
	private readonly mapWidth: number;
	private readonly mapHeight: number;
	private readonly currentAppleCap: number;
	private readonly map: GameMapLayout;
	private status: GameStatus = 'playing';
	private snakeBody: Position[] = [];
	private snakeDirection: Direction = 'right';
	private queuedDirection: Direction = 'right';
	private targetLength = STARTING_SNAKE_LENGTH;
	private score = 0;
	private pointsMultiplier = 1.0;
	private activeEffects: ActiveEffect[] = [];
	private apples: Apple[] = [];
	private bonusChain: BonusChainState | null = null;
	private goldRushEndsAt: number | null = null;
	private iceAgeEndsAt: number | null = null;
	private gatePhase: GatePhase | null = null;
	private pinnedBodyState: PinnedBodyState | null = null;
	private gameTimeMs = 0;
	private tickCount = 0;
	private nextAppleId = 0;
	private nextEventAtMs: number | null = null;

	constructor(difficulty: Difficulty, mapId: MapId, seed: number) {
		this.random = createSeededRandom(seed);
		this.config = DIFFICULTIES[difficulty];
		this.mapWidth = this.config.mapWidth;
		this.mapHeight = this.config.mapHeight;
		this.currentAppleCap = MAX_APPLES_BY_DIFFICULTY[difficulty];
		this.map = createMapLayout(mapId, this.mapWidth, this.mapHeight);
		this.init();
	}

	run(maxTicks: number, rawInputs: GameReplayInput['inputs']): GameReplayResult {
		const inputs = rawInputs
			.map((input, index) => ({ ...input, index }))
			.sort((a, b) => a.tick - b.tick || a.index - b.index);
		let inputIndex = 0;

		while (this.status === 'playing' && this.tickCount < maxTicks) {
			while (inputIndex < inputs.length && inputs[inputIndex]!.tick <= this.tickCount) {
				this.setDirection(inputs[inputIndex]!.direction);
				inputIndex += 1;
			}

			const tickDelayMs = this.getCurrentTickMs();
			this.gameTimeMs += tickDelayMs;
			this.tickCount += 1;
			this.updateGame(this.gameTimeMs);
		}

		return {
			gameOver: this.status === 'gameOver',
			score: this.score,
			tickCount: this.tickCount,
			elapsedMs: this.gameTimeMs
		};
	}

	private init() {
		const centerX = Math.floor(this.mapWidth / 2);
		const centerY = Math.floor(this.mapHeight / 2);
		this.snakeBody = [
			{ x: centerX, y: centerY },
			{ x: centerX - 1, y: centerY },
			{ x: centerX - 2, y: centerY }
		];
		this.gatePhase = this.getCurrentGatePhase(0);
		this.nextEventAtMs = getRandomGameEventDelay(this.random);
		this.fillApplesToCap();
	}

	private get activeEventType(): GameEventType | null {
		if (this.bonusChain) return 'bonusChain';
		if (this.goldRushEndsAt !== null) return 'goldRush';
		if (this.iceAgeEndsAt !== null) return 'iceAge';
		return null;
	}

	private get isGhostActive() {
		return this.activeEffects.some((effect) => effect.type === 'ghost');
	}

	private get isIceAgeActive() {
		return this.iceAgeEndsAt !== null;
	}

	private getCurrentTickMs() {
		const turbo = this.activeEffects.find((effect) => effect.type === 'turbo');
		const chill = this.activeEffects.find((effect) => effect.type === 'chill');
		if (turbo) return this.config.tickMs / TURBO_SPEED_MULTIPLIER;
		if (chill) return this.config.tickMs / CHILL_SPEED_MULTIPLIER;
		return this.config.tickMs;
	}

	private getDisplayMultiplier() {
		const turbo = this.activeEffects.find((effect) => effect.type === 'turbo');
		const chill = this.activeEffects.find((effect) => effect.type === 'chill');
		let multiplier = this.pointsMultiplier;
		if (turbo) multiplier += TURBO_POINTS_DELTA;
		if (chill) multiplier += CHILL_POINTS_DELTA;
		return clamp(multiplier, MIN_POINTS_MULTIPLIER, MAX_POINTS_MULTIPLIER);
	}

	private setDirection(direction: Direction) {
		const currentVector = directionToVector(this.snakeDirection);
		const nextVector = directionToVector(direction);
		if (!areOpposite(currentVector, nextVector)) {
			this.queuedDirection = direction;
		}
	}

	private fillApplesToCap() {
		while (
			this.apples.filter((apple) => apple.source !== 'greedinessGate').length < this.currentAppleCap
		) {
			const spawnRules = this.getSpawnRules();
			const newApple = spawnApple({
				snakeBody: this.snakeBody,
				apples: this.apples,
				mapWidth: this.mapWidth,
				mapHeight: this.mapHeight,
				blockedPositions: this.map.appleBlockedCells,
				createId: () => this.getNextAppleId(),
				specialAppleLifetimeMs: spawnRules.specialAppleLifetimeMs,
				rottenLifetimeMs: spawnRules.rottenLifetimeMs,
				now: this.gameTimeMs,
				forcedType: spawnRules.forcedType,
				ignoreSpecialLimit: spawnRules.ignoreSpecialLimit,
				pool: spawnRules.pool,
				random: this.random
			});
			if (!newApple) break;
			this.apples.push(newApple);
		}

		if (this.bonusChain) {
			this.apples = ensureCurrentBonusChainTargetAvailable({
				chain: this.bonusChain,
				apples: this.apples,
				createId: () => this.getNextAppleId(),
				specialAppleLifetimeMs: this.config.specialAppleLifetimeMs,
				now: this.gameTimeMs
			});
		}
	}

	private getSpawnRules() {
		if (this.goldRushEndsAt !== null) {
			return {
				forcedType: 'golden' as const,
				specialAppleLifetimeMs: this.getGoldRushSpecialLifetimeMs(),
				rottenLifetimeMs: this.getGoldRushRottenLifetimeMs(),
				ignoreSpecialLimit: true,
				pool: undefined
			};
		}

		const pool =
			this.iceAgeEndsAt !== null
				? (Object.keys(APPLE_SPAWN_WEIGHTS) as SpawnableAppleType[]).filter(
						(type) => type !== 'turbo'
					)
				: undefined;

		return {
			forcedType: getPendingBonusChainSpawnType(this.bonusChain, this.apples),
			specialAppleLifetimeMs: this.config.specialAppleLifetimeMs,
			rottenLifetimeMs: ROTTEN_APPLE_LIFETIME_MS,
			ignoreSpecialLimit: false,
			pool
		};
	}

	private getNextAppleId() {
		this.nextAppleId += 1;
		return `apple-${this.nextAppleId}`;
	}

	private getGoldRushSpecialLifetimeMs() {
		return Math.max(
			1,
			Math.round(this.config.specialAppleLifetimeMs * GOLD_RUSH_SPECIAL_LIFETIME_MULTIPLIER)
		);
	}

	private getGoldRushRottenLifetimeMs() {
		return Math.max(1, Math.round(ROTTEN_APPLE_LIFETIME_MS * GOLD_RUSH_ROTTEN_LIFETIME_MULTIPLIER));
	}

	private updateGame(now: number) {
		this.checkDueGameEvents(now);
		this.checkEventExpiry(now);
		this.checkMapState(now);
		if (this.status !== 'playing') return;

		this.clearExpiredEffects(now);
		this.updateApplesForExpiry(now);
		this.snakeDirection = this.queuedDirection;
		this.runMovementChain();
	}

	private checkDueGameEvents(now: number) {
		while (this.nextEventAtMs !== null && this.nextEventAtMs <= now && this.status === 'playing') {
			this.maybeTriggerGameEvent(now);
			this.nextEventAtMs += getRandomGameEventDelay(this.random);
		}
	}

	private maybeTriggerGameEvent(now: number) {
		if (this.activeEventType || this.status !== 'playing') return;
		if (!shouldTriggerGameEvent(this.random)) return;

		const availableEvents: GameEventType[] = ['goldRush', 'iceAge'];
		if (this.apples.some((apple) => apple.type !== 'rotten')) {
			availableEvents.push('bonusChain');
		}

		const nextEvent = pickRandomGameEvent(availableEvents, this.random);
		if (nextEvent === 'bonusChain') {
			this.startBonusChain();
			return;
		}
		if (nextEvent === 'goldRush') {
			this.startGoldRush(now);
			return;
		}
		if (nextEvent === 'iceAge') {
			this.startIceAge(now);
		}
	}

	private startBonusChain() {
		if (this.activeEventType || this.status !== 'playing') return;
		const chain = createBonusChain(this.apples, this.gameTimeMs, this.random);
		if (!chain) return;
		this.bonusChain = chain;
		this.apples = ensureCurrentBonusChainTargetAvailable({
			chain: this.bonusChain,
			apples: this.apples,
			createId: () => this.getNextAppleId(),
			specialAppleLifetimeMs: this.config.specialAppleLifetimeMs,
			now: this.gameTimeMs
		});
	}

	private startGoldRush(now: number) {
		if (this.activeEventType || this.status !== 'playing') return;
		this.goldRushEndsAt = now + GOLD_RUSH_DURATION_MS;
		this.apples = normalizeSpawnableApples({
			apples: this.apples,
			type: 'golden',
			specialAppleLifetimeMs: this.getGoldRushSpecialLifetimeMs(),
			rottenLifetimeMs: this.getGoldRushRottenLifetimeMs(),
			now
		});
		this.fillApplesToCap();
	}

	private startIceAge(now: number) {
		if (this.activeEventType || this.status !== 'playing') return;
		this.iceAgeEndsAt = now + ICE_AGE_DURATION_MS;
		this.activeEffects = replaceSpeedEffect(this.activeEffects, 'chill', ICE_AGE_DURATION_MS, now);
		this.apples = this.apples.map((apple) =>
			apple.type === 'turbo' ? { ...apple, type: 'chill' } : apple
		);
	}

	private checkEventExpiry(now: number) {
		if (this.goldRushEndsAt && this.goldRushEndsAt <= now) {
			this.goldRushEndsAt = null;
		}
		if (this.iceAgeEndsAt && this.iceAgeEndsAt <= now) {
			this.iceAgeEndsAt = null;
		}
	}

	private clearExpiredEffects(now: number) {
		this.activeEffects = this.activeEffects.filter((effect) => effect.expiresAt > now);
	}

	private updateApplesForExpiry(now: number) {
		const result = updateExpiredApples(this.apples, now);
		if (!result.didChange) return;
		this.apples = result.apples;
		this.fillApplesToCap();
	}

	private runMovementChain() {
		let pendingSteps = 1;
		let ateApple = false;

		while (pendingSteps > 0 && this.status === 'playing') {
			pendingSteps -= 1;
			const eatenApple = this.moveSnakeForwardOneTile();
			if (this.status !== 'playing') return;
			if (!eatenApple) continue;

			ateApple = true;
			pendingSteps += this.applyEatenAppleEffect(eatenApple);
		}

		if (ateApple) {
			this.fillApplesToCap();
		}
	}

	private moveSnakeForwardOneTile() {
		const head = this.snakeBody[0];
		if (!head) return null;

		const nextPosition = getNextPosition(head, this.snakeDirection);
		const portalMove = this.getPortalMove(nextPosition);
		const newHead = portalMove.position;

		if (isOutsideBounds(newHead, this.mapWidth, this.mapHeight)) {
			this.triggerGameOver();
			return null;
		}

		if (this.isBlockedMapCell(newHead) || this.isClosedChamberCell(newHead)) {
			this.triggerGameOver();
			return null;
		}

		if (this.pinnedBodyState?.pinnedBody.some((segment) => isSamePosition(segment, newHead))) {
			this.triggerGameOver();
			return null;
		}

		if (collidesWithSnakeBody(newHead, this.snakeBody, this.targetLength, this.isGhostActive)) {
			this.triggerGameOver();
			return null;
		}

		this.snakeBody.unshift(newHead);
		while (this.snakeBody.length > this.targetLength) {
			this.snakeBody.pop();
		}

		if (this.pinnedBodyState && !positionListIncludes(this.pinnedBodyState.allowedCells, newHead)) {
			this.failPinnedBody();
		}

		return this.apples.find((apple) => isSamePosition(newHead, apple.position)) ?? null;
	}

	private getPortalMove(position: Position) {
		const portal = this.map.portals.find((candidate) =>
			isSamePosition(candidate.position, position)
		);
		if (!portal) return { position };
		return { position: { ...portal.pairedPosition } };
	}

	private applyEatenAppleEffect(eatenApple: Apple) {
		this.handleBonusChainAppleEat(eatenApple);
		const result = applyAppleEffect({
			apple: eatenApple,
			score: this.score,
			targetLength: this.targetLength,
			snakeBody: this.snakeBody,
			pointsMultiplier: this.pointsMultiplier,
			activeEffects: this.activeEffects,
			displayMultiplier: this.getDisplayMultiplier(),
			iceAgeActive: this.isIceAgeActive,
			now: this.gameTimeMs
		});

		this.score = result.score;
		this.targetLength = result.targetLength;
		this.snakeBody = result.snakeBody;
		this.pointsMultiplier = result.pointsMultiplier;
		this.activeEffects = result.activeEffects;
		this.apples = removeApple(this.apples, eatenApple.id);
		return result.extraForwardSteps;
	}

	private handleBonusChainAppleEat(eatenApple: Apple) {
		const result = advanceBonusChain(this.bonusChain, eatenApple.type);
		if (result.completed) {
			this.score += BONUS_CHAIN_COMPLETION_BONUS;
		}
		this.bonusChain = result.chain;
	}

	private checkMapState(now: number) {
		const nextGatePhase = this.getCurrentGatePhase(now);
		if (!nextGatePhase) {
			this.gatePhase = null;
			this.pinnedBodyState = null;
			return;
		}

		if (this.gatePhase === nextGatePhase) return;
		this.gatePhase = nextGatePhase;

		if (nextGatePhase === 'open') {
			this.pinnedBodyState = null;
			this.spawnGreedinessGateApples(now);
		}
		if (nextGatePhase === 'closed') {
			this.removeGreedinessGateApples();
			const layout = this.map.greedinessGates;
			const head = this.snakeBody[0];
			if (layout && head && positionListIncludes(layout.chamberCells, head)) {
				this.triggerGameOver();
				return;
			}
			this.pinSnakeBodyAtClosingGate();
		}
	}

	private getCurrentGatePhase(now: number) {
		const layout = this.map.greedinessGates;
		if (!layout) return null;
		return getGreedinessGatePhase(layout, now, 0);
	}

	private isBlockedMapCell(position: Position) {
		if (positionListIncludes(this.map.wallCells, position)) return true;
		const layout = this.map.greedinessGates;
		return (
			!!layout && this.gatePhase === 'closed' && positionListIncludes(layout.gateCells, position)
		);
	}

	private isClosedChamberCell(position: Position) {
		const layout = this.map.greedinessGates;
		return (
			!!layout && this.gatePhase === 'closed' && positionListIncludes(layout.chamberCells, position)
		);
	}

	private spawnGreedinessGateApples(now: number) {
		const layout = this.map.greedinessGates;
		if (!layout) return;

		for (const position of layout.goldenApplePositions) {
			if (this.isPositionOccupied(position)) continue;
			this.apples.push(
				buildApple({
					id: this.getNextAppleId(),
					type: 'golden',
					position,
					specialAppleLifetimeMs: layout.openMs + layout.warningMs + 1000,
					now,
					source: 'greedinessGate'
				})
			);
		}
	}

	private removeGreedinessGateApples() {
		this.apples = this.apples.filter((apple) => apple.source !== 'greedinessGate');
	}

	private isPositionOccupied(position: Position) {
		return (
			this.snakeBody.some((segment) => isSamePosition(segment, position)) ||
			this.apples.some((apple) => isSamePosition(apple.position, position))
		);
	}

	private pinSnakeBodyAtClosingGate() {
		const layout = this.map.greedinessGates;
		const head = this.snakeBody[0];
		if (!layout || !head) return;

		if (positionListIncludes(layout.gateCells, head)) {
			this.triggerGameOver();
			return;
		}

		const pinIndex = this.snakeBody.findIndex(
			(segment, index) => index > 0 && positionListIncludes(layout.gateCells, segment)
		);
		if (pinIndex < 0) return;

		const originalLength = this.snakeBody.length;
		const activeBody = this.snakeBody.slice(0, pinIndex);
		const pinnedBody = this.snakeBody.slice(pinIndex);
		const pinnedAt = { ...this.snakeBody[pinIndex]! };
		this.snakeBody = activeBody;
		this.targetLength = activeBody.length;
		this.pinnedBodyState = {
			pinnedAt,
			pinnedBody,
			allowedCells: this.createPinnedMovementArea(
				pinnedAt,
				activeBody[0] ?? pinnedAt,
				activeBody.length
			),
			penaltyRatio: Math.min(
				GREEDINESS_GATE_MAX_CUT_PENALTY_RATIO,
				pinnedBody.length / Math.max(1, originalLength)
			)
		};
	}

	private createPinnedMovementArea(pinnedAt: Position, head: Position, activeLength: number) {
		const radius = Math.max(2, activeLength);
		const dxToHead = head.x - pinnedAt.x;
		const dyToHead = head.y - pinnedAt.y;
		const horizontal = Math.abs(dxToHead) >= Math.abs(dyToHead);
		const direction = horizontal ? Math.sign(dxToHead) || -1 : Math.sign(dyToHead) || -1;
		const cells: Position[] = [];

		for (let x = 0; x < this.mapWidth; x++) {
			for (let y = 0; y < this.mapHeight; y++) {
				const dx = x - pinnedAt.x;
				const dy = y - pinnedAt.y;
				const forward = horizontal ? dx * direction : dy * direction;
				const side = horizontal ? Math.abs(dy) : Math.abs(dx);
				if (forward >= 0 && forward < radius && side <= radius - 1) {
					cells.push({ x, y });
				}
			}
		}

		return cells;
	}

	private failPinnedBody() {
		const pinned = this.pinnedBodyState;
		if (!pinned) return;
		const penalty = Math.round(this.score * pinned.penaltyRatio);
		this.score = Math.max(0, this.score - penalty);
		this.pinnedBodyState = null;
	}

	private triggerGameOver() {
		this.status = 'gameOver';
	}
}

function getRandomGameEventDelay(random: RandomSource) {
	const range = GAME_EVENT_TRIGGER_MAX_MS - GAME_EVENT_TRIGGER_MIN_MS;
	return GAME_EVENT_TRIGGER_MIN_MS + Math.round(random() * range);
}

function shouldTriggerGameEvent(random: RandomSource) {
	return random() <= GAME_EVENT_TRIGGER_CHANCE;
}

function pickRandomGameEvent(eventTypes: GameEventType[], randomSource: RandomSource) {
	const totalWeight = eventTypes.reduce(
		(sum, eventType) => sum + GAME_EVENT_TRIGGER_WEIGHTS[eventType],
		0
	);
	if (totalWeight <= 0) return null;

	let random = randomSource() * totalWeight;
	for (const eventType of eventTypes) {
		random -= GAME_EVENT_TRIGGER_WEIGHTS[eventType];
		if (random <= 0) return eventType;
	}

	return eventTypes[0] ?? null;
}

function createBonusChain(
	apples: Apple[],
	now: number,
	randomSource: RandomSource
): BonusChainState | null {
	const availableTypes = apples
		.filter((apple) => apple.type !== 'rotten')
		.map((apple) => apple.type as SpawnableAppleType);
	if (availableTypes.length === 0) return null;

	const firstStep = availableTypes[Math.floor(randomSource() * availableTypes.length)];
	if (!firstStep) return null;

	const steps: SpawnableAppleType[] = [firstStep];
	while (steps.length < BONUS_CHAIN_LENGTH) {
		const nextType = getNextBonusChainType(steps, randomSource);
		if (!nextType) return null;
		steps.push(nextType);
	}

	return { steps, currentIndex: 0, startedAt: now };
}

function advanceBonusChain(chain: BonusChainState | null, eatenType: AppleType) {
	const target = chain?.steps[chain.currentIndex] ?? null;
	if (!chain || !target) return { chain, completed: false };
	if (eatenType !== target) return { chain: null, completed: false };
	if (chain.currentIndex >= chain.steps.length - 1) return { chain: null, completed: true };
	return { chain: { ...chain, currentIndex: chain.currentIndex + 1 }, completed: false };
}

function getPendingBonusChainSpawnType(chain: BonusChainState | null, apples: Apple[]) {
	const target = chain?.steps[chain.currentIndex] ?? null;
	if (!target) return null;
	if (apples.some((apple) => apple.type === target)) return null;
	return target;
}

function getNextBonusChainType(steps: SpawnableAppleType[], randomSource: RandomSource) {
	const counts = new Map<SpawnableAppleType, number>();
	for (const type of steps) {
		counts.set(type, (counts.get(type) ?? 0) + 1);
	}

	const eligibleTypes = (Object.keys(APPLE_SPAWN_WEIGHTS) as SpawnableAppleType[]).filter(
		(type) => (counts.get(type) ?? 0) < BONUS_CHAIN_MAX_DUPLICATE_PER_TYPE
	);
	if (eligibleTypes.length === 0) return null;
	return getRandomWeightedType(eligibleTypes, randomSource);
}

function ensureCurrentBonusChainTargetAvailable(options: {
	chain: BonusChainState | null;
	apples: Apple[];
	createId: () => string;
	specialAppleLifetimeMs: number;
	now: number;
}) {
	const target = options.chain?.steps[options.chain.currentIndex] ?? null;
	if (!target) return options.apples;
	if (options.apples.some((apple) => apple.type === target)) return options.apples;

	const replacementIndex = findBonusChainReplacementIndex(options.apples, target);
	const replacement = options.apples[replacementIndex];
	if (!replacement) return options.apples;

	const nextApple = buildApple({
		id: options.createId(),
		type: target,
		position: replacement.position,
		specialAppleLifetimeMs: options.specialAppleLifetimeMs,
		now: options.now
	});
	return options.apples.map((apple, index) =>
		index === replacementIndex ? { ...nextApple, id: apple.id } : apple
	);
}

function findBonusChainReplacementIndex(apples: Apple[], target: SpawnableAppleType) {
	const targetIsSpecial = isSpecialAppleType(target);
	const candidateIndexes = apples
		.map((apple, index) => ({ apple, index }))
		.filter(({ apple }) => apple.type !== target && apple.source !== 'greedinessGate');
	candidateIndexes.sort(
		(a, b) =>
			getBonusChainReplacementPriority(a.apple.type, targetIsSpecial) -
			getBonusChainReplacementPriority(b.apple.type, targetIsSpecial)
	);
	return candidateIndexes[0]?.index ?? -1;
}

function getBonusChainReplacementPriority(type: AppleType, targetIsSpecial: boolean) {
	if (targetIsSpecial) {
		if (isSpecialAppleType(type)) return 0;
		if (type === 'rotten') return 1;
		return 2;
	}
	if (type === 'rotten') return 0;
	if (type === 'classic') return 1;
	if (isSpecialAppleType(type)) return 2;
	return 3;
}

function spawnApple(options: {
	snakeBody: Position[];
	apples: Apple[];
	mapWidth: number;
	mapHeight: number;
	blockedPositions: Position[];
	createId: () => string;
	specialAppleLifetimeMs: number;
	rottenLifetimeMs?: number;
	now: number;
	forcedType?: SpawnableAppleType | null;
	ignoreSpecialLimit: boolean;
	pool?: SpawnableAppleType[];
	random: RandomSource;
}) {
	const position = getRandomEmptyCell(options);
	if (!position) return null;
	const type =
		options.forcedType &&
		canSpawnForcedType(options.forcedType, options.apples, options.ignoreSpecialLimit)
			? options.forcedType
			: chooseSpawnType(options.apples, options.ignoreSpecialLimit, options.pool, options.random);
	return buildApple({
		id: options.createId(),
		type,
		position,
		specialAppleLifetimeMs: options.specialAppleLifetimeMs,
		rottenLifetimeMs: options.rottenLifetimeMs,
		now: options.now
	});
}

function getRandomEmptyCell(options: {
	snakeBody: Position[];
	apples: Apple[];
	mapWidth: number;
	mapHeight: number;
	blockedPositions: Position[];
	random: RandomSource;
}) {
	const occupied = new Set(options.snakeBody.map((position) => `${position.x},${position.y}`));
	for (const apple of options.apples) occupied.add(`${apple.position.x},${apple.position.y}`);
	for (const position of options.blockedPositions) occupied.add(`${position.x},${position.y}`);

	const emptyCells: Position[] = [];
	for (let x = 0; x < options.mapWidth; x++) {
		for (let y = 0; y < options.mapHeight; y++) {
			if (!occupied.has(`${x},${y}`)) emptyCells.push({ x, y });
		}
	}

	if (emptyCells.length === 0) return null;
	return emptyCells[Math.floor(options.random() * emptyCells.length)]!;
}

function chooseSpawnType(
	apples: Apple[],
	ignoreSpecialLimit: boolean,
	pool: SpawnableAppleType[] | undefined,
	random: RandomSource
) {
	const specialAppleCount = apples.filter((apple) => isSpecialAppleType(apple.type)).length;
	if (!ignoreSpecialLimit && specialAppleCount >= MAX_SPECIAL_APPLES) return 'classic';
	return getRandomWeightedType(
		pool ?? (Object.keys(APPLE_SPAWN_WEIGHTS) as SpawnableAppleType[]),
		random
	);
}

function getRandomWeightedType(pool: SpawnableAppleType[], randomSource: RandomSource) {
	const totalWeight = pool.reduce((sum, type) => sum + APPLE_SPAWN_WEIGHTS[type], 0);
	let random = randomSource() * totalWeight;
	for (const type of pool) {
		random -= APPLE_SPAWN_WEIGHTS[type];
		if (random <= 0) return type;
	}
	return pool[0] ?? 'classic';
}

function buildApple(options: {
	id: string;
	type: AppleType;
	position: Position;
	specialAppleLifetimeMs: number;
	rottenLifetimeMs?: number;
	source?: Apple['source'];
	now: number;
}): Apple {
	const rottenLifetimeMs = options.rottenLifetimeMs ?? ROTTEN_APPLE_LIFETIME_MS;
	const expiresAt =
		options.type === 'rotten'
			? options.now + rottenLifetimeMs
			: isSpecialAppleType(options.type)
				? options.now + options.specialAppleLifetimeMs
				: null;
	return {
		id: options.id,
		type: options.type,
		position: options.position,
		spawnedAt: options.now,
		expiresAt,
		rottenLifetimeMs,
		source: options.source
	};
}

function canSpawnForcedType(
	type: SpawnableAppleType,
	apples: Apple[],
	ignoreSpecialLimit: boolean
) {
	if (!isSpecialAppleType(type) || ignoreSpecialLimit) return true;
	const specialAppleCount = apples.filter((apple) => isSpecialAppleType(apple.type)).length;
	return specialAppleCount < MAX_SPECIAL_APPLES;
}

function isSpecialAppleType(type: AppleType): type is Exclude<AppleType, 'classic' | 'rotten'> {
	return type !== 'classic' && type !== 'rotten';
}

function removeApple(apples: Apple[], id: string) {
	return apples.filter((apple) => apple.id !== id);
}

function updateExpiredApples(apples: Apple[], now: number) {
	let didChange = false;
	const nextApples: Apple[] = [];

	for (const apple of apples) {
		if (!apple.expiresAt || apple.expiresAt > now) {
			nextApples.push(apple);
			continue;
		}

		didChange = true;
		if (isSpecialAppleType(apple.type)) {
			nextApples.push({
				...apple,
				type: 'rotten',
				spawnedAt: now,
				expiresAt: now + (apple.rottenLifetimeMs ?? ROTTEN_APPLE_LIFETIME_MS)
			});
		}
	}

	return { apples: nextApples, didChange };
}

function normalizeSpawnableApples(options: {
	apples: Apple[];
	type: SpawnableAppleType;
	specialAppleLifetimeMs: number;
	rottenLifetimeMs?: number;
	now: number;
}) {
	return options.apples.map((apple) => {
		if (apple.type === 'rotten') return apple;
		return {
			...buildApple({
				id: apple.id,
				type: options.type,
				position: apple.position,
				specialAppleLifetimeMs: options.specialAppleLifetimeMs,
				rottenLifetimeMs: options.rottenLifetimeMs,
				source: apple.source,
				now: options.now
			}),
			id: apple.id
		};
	});
}

function applyAppleEffect(options: {
	apple: Apple;
	score: number;
	targetLength: number;
	snakeBody: Position[];
	pointsMultiplier: number;
	activeEffects: ActiveEffect[];
	displayMultiplier: number;
	iceAgeActive: boolean;
	now: number;
}) {
	let nextScore = options.score;
	let nextTargetLength = options.targetLength;
	let nextSnakeBody = options.snakeBody;
	const nextPointsMultiplier = options.pointsMultiplier;
	let nextActiveEffects = options.activeEffects;
	let extraForwardSteps = 0;

	switch (options.apple.type) {
		case 'classic':
			nextScore += Math.round(BASE_POINTS * options.displayMultiplier);
			nextTargetLength += CLASSIC_LENGTH_DELTA;
			break;
		case 'shrink':
			nextTargetLength = Math.max(MIN_SNAKE_LENGTH, nextTargetLength + SHRINK_LENGTH_DELTA);
			nextSnakeBody = nextSnakeBody.slice(0, nextTargetLength);
			break;
		case 'turbo':
			nextTargetLength += CLASSIC_LENGTH_DELTA;
			nextActiveEffects = replaceSpeedEffect(
				nextActiveEffects,
				'turbo',
				TURBO_DURATION_MS,
				options.now
			);
			break;
		case 'chill':
			nextTargetLength += CLASSIC_LENGTH_DELTA;
			if (options.iceAgeActive) extraForwardSteps = 1;
			else
				nextActiveEffects = replaceSpeedEffect(
					nextActiveEffects,
					'chill',
					CHILL_DURATION_MS,
					options.now
				);
			break;
		case 'ghost':
			nextTargetLength += CLASSIC_LENGTH_DELTA;
			nextActiveEffects = refreshGhostEffect(nextActiveEffects, GHOST_DURATION_MS, options.now);
			break;
		case 'golden':
			nextScore += Math.round(BASE_POINTS * options.displayMultiplier * GOLDEN_SCORE_MULTIPLIER);
			break;
		case 'rotten':
			nextScore = Math.max(0, nextScore - BASE_POINTS);
			break;
	}

	return {
		score: nextScore,
		targetLength: nextTargetLength,
		snakeBody: nextSnakeBody,
		pointsMultiplier: nextPointsMultiplier,
		activeEffects: nextActiveEffects,
		extraForwardSteps
	};
}

function replaceSpeedEffect(
	activeEffects: ActiveEffect[],
	type: 'turbo' | 'chill',
	durationMs: number,
	now: number
) {
	return [
		...activeEffects.filter((effect) => effect.type !== 'turbo' && effect.type !== 'chill'),
		createActiveEffect(type, durationMs, now)
	];
}

function refreshGhostEffect(activeEffects: ActiveEffect[], durationMs: number, now: number) {
	const existingGhost = activeEffects.find((effect) => effect.type === 'ghost');
	if (!existingGhost) return [...activeEffects, createActiveEffect('ghost', durationMs, now)];
	return activeEffects.map((effect) =>
		effect.type === 'ghost' ? { ...effect, durationMs, expiresAt: now + durationMs } : effect
	);
}

function createActiveEffect(
	type: ActiveEffect['type'],
	durationMs: number,
	now: number
): ActiveEffect {
	return { type, startedAt: now, durationMs, expiresAt: now + durationMs };
}

function directionToVector(direction: Direction): Position {
	switch (direction) {
		case 'up':
			return { x: 0, y: -1 };
		case 'down':
			return { x: 0, y: 1 };
		case 'left':
			return { x: -1, y: 0 };
		case 'right':
			return { x: 1, y: 0 };
	}
}

function areOpposite(a: Position, b: Position) {
	return a.x === -b.x && a.y === -b.y;
}

function isSamePosition(a: Position, b: Position) {
	return a.x === b.x && a.y === b.y;
}

function getNextPosition(position: Position, direction: Direction): Position {
	const vector = directionToVector(direction);
	return { x: position.x + vector.x, y: position.y + vector.y };
}

function isOutsideBounds(position: Position, mapWidth: number, mapHeight: number) {
	return position.x < 0 || position.x >= mapWidth || position.y < 0 || position.y >= mapHeight;
}

function collidesWithSnakeBody(
	position: Position,
	snakeBody: Position[],
	targetLength: number,
	canPassThroughBody: boolean
) {
	if (canPassThroughBody) return false;
	const willMoveTail = snakeBody.length >= targetLength;
	const collisionBody = willMoveTail ? snakeBody.slice(0, -1) : snakeBody;
	return collisionBody.some((segment) => isSamePosition(segment, position));
}

function clamp(value: number, min: number, max: number) {
	return Math.min(Math.max(value, min), max);
}

function createMapLayout(mapId: MapId, width: number, height: number): GameMapLayout {
	if (mapId === 'portals') return createPortalsLayout(width, height);
	if (mapId === 'greedinessGates') return createGreedinessGatesLayout(width);
	return { wallCells: [], appleBlockedCells: [], portals: [], greedinessGates: null };
}

function createPortalsLayout(width: number, height: number): GameMapLayout {
	const upperY = 3;
	const lowerY = height - 4;
	const bluePortal = { x: clampInt(Math.floor(width * 0.28), 4, width - 5), y: upperY };
	const orangePortal = { x: clampInt(Math.floor(width * 0.72), 5, width - 4), y: lowerY };
	const wallCells: Position[] = [];
	const tunnelCells: Position[] = [];

	addHorizontalTunnel(
		wallCells,
		tunnelCells,
		1,
		bluePortal.x + clampInt(Math.floor(width / 4), 3, 5),
		bluePortal.y
	);
	addHorizontalTunnel(
		wallCells,
		tunnelCells,
		orangePortal.x - clampInt(Math.floor(width / 4), 3, 5),
		width - 2,
		orangePortal.y
	);

	return {
		wallCells: uniquePositions(wallCells),
		appleBlockedCells: uniquePositions([...wallCells, ...tunnelCells, bluePortal, orangePortal]),
		portals: [
			{ position: bluePortal, pairedPosition: orangePortal },
			{ position: orangePortal, pairedPosition: bluePortal }
		],
		greedinessGates: null
	};
}

function createGreedinessGatesLayout(width: number): GameMapLayout {
	const chamberLength = clampInt(8, 5, width - 5);
	const chamberStartX = Math.floor((width - chamberLength) / 2);
	const chamberEndX = chamberStartX + chamberLength - 1;
	const chamberStartY = 2;
	const chamberEndY = chamberStartY + 1;
	const gateStartX = Math.floor((chamberStartX + chamberEndX) / 2);
	const gateEndX = gateStartX + 1;
	const gateY = chamberEndY + 1;
	const chamberCells: Position[] = [];
	const gateCells: Position[] = [];
	const wallCells: Position[] = [];

	for (let x = chamberStartX; x <= chamberEndX; x++) {
		chamberCells.push({ x, y: chamberStartY }, { x, y: chamberEndY });
		wallCells.push({ x, y: chamberStartY - 1 });
		if (x < gateStartX || x > gateEndX) wallCells.push({ x, y: gateY });
	}

	wallCells.push(
		{ x: chamberStartX - 1, y: chamberStartY },
		{ x: chamberStartX - 1, y: chamberEndY },
		{ x: chamberEndX + 1, y: chamberStartY },
		{ x: chamberEndX + 1, y: chamberEndY }
	);
	gateCells.push({ x: gateStartX, y: gateY }, { x: gateEndX, y: gateY });

	const greedinessGates = {
		chamberCells,
		gateCells,
		goldenApplePositions: [
			{ x: chamberStartX, y: chamberStartY },
			{ x: chamberEndX, y: chamberEndY }
		],
		closedMs: GREEDINESS_GATE_CLOSED_MS,
		openMs: GREEDINESS_GATE_OPEN_MS,
		warningMs: GREEDINESS_GATE_WARNING_MS,
		cycleMs: GREEDINESS_GATE_CLOSED_MS + GREEDINESS_GATE_OPEN_MS + GREEDINESS_GATE_WARNING_MS
	};

	return {
		wallCells: uniquePositions(wallCells),
		appleBlockedCells: uniquePositions([...wallCells, ...gateCells, ...chamberCells]),
		portals: [],
		greedinessGates
	};
}

function getGreedinessGatePhase(
	layout: NonNullable<GameMapLayout['greedinessGates']>,
	now: number,
	startedAt: number
) {
	const elapsed = positiveModulo(now - startedAt, layout.cycleMs);
	if (elapsed < layout.closedMs) return 'closed';
	if (elapsed < layout.closedMs + layout.openMs) return 'open';
	return 'warning';
}

function positionListIncludes(positions: Position[], position: Position) {
	return positions.some((candidate) => isSamePosition(candidate, position));
}

function addHorizontalTunnel(
	wallCells: Position[],
	tunnelCells: Position[],
	startX: number,
	endX: number,
	y: number
) {
	const minX = Math.min(startX, endX);
	const maxX = Math.max(startX, endX);
	for (let x = minX; x <= maxX; x++) {
		tunnelCells.push({ x, y });
		wallCells.push({ x, y: y - 1 }, { x, y: y + 1 });
	}
}

function uniquePositions(positions: Position[]) {
	const seen = new Set<string>();
	const result: Position[] = [];
	for (const position of positions) {
		const key = `${position.x},${position.y}`;
		if (seen.has(key)) continue;
		seen.add(key);
		result.push(position);
	}
	return result;
}

function clampInt(value: number, min: number, max: number) {
	return Math.max(min, Math.min(max, value));
}

function positiveModulo(value: number, modulo: number) {
	return ((value % modulo) + modulo) % modulo;
}
