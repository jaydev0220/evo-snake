import type { Difficulty, MapId } from '@packages/types';
import { computed, ref, type Ref } from 'vue';

import {
	ASIAN_APPLE_FEEDBACK_LINE_COUNT,
	getRandomMessageIndex,
	isAsianDifficulty,
	type AsianFeedbackAppleType
} from '../asian-mode';
import {
	APPLE_SPAWN_WEIGHTS,
	BONUS_CHAIN_COMPLETION_BONUS,
	DIFFICULTIES,
	GAME_EVENT_THEMES,
	GOLD_RUSH_DURATION_MS,
	GOLD_RUSH_ROTTEN_LIFETIME_MULTIPLIER,
	GOLD_RUSH_SPECIAL_LIFETIME_MULTIPLIER,
	GREEDINESS_GATE_MAX_CUT_PENALTY_RATIO,
	ICE_AGE_DURATION_MS,
	MAX_APPLES_BY_DIFFICULTY,
	ROTTEN_APPLE_LIFETIME_MS,
	STARTING_SNAKE_LENGTH,
	type ActiveEffect,
	type Apple,
	type BonusChainState,
	type Direction,
	type GameEventType,
	type GameStatus,
	type Position,
	type SpawnableAppleType
} from '../data';
import {
	buildApple,
	normalizeSpawnableApples,
	removeApple,
	spawnApple,
	updateExpiredApples
} from './apples';
import {
	advanceBonusChain,
	createBonusChain,
	ensureCurrentBonusChainTargetAvailable,
	getCurrentBonusChainTarget,
	getBonusChainSteps,
	getPendingBonusChainSpawnType
} from './bonus-chain';
import {
	applyAppleEffect,
	applySpeedEffect,
	clearExpiredEffects,
	getActiveEffectsList,
	getCurrentTickMs,
	getDisplayMultiplier
} from './effects';
import { getRandomGameEventDelay, pickRandomGameEvent, shouldTriggerGameEvent } from './events';
import {
	areOpposite,
	clamp,
	collidesWithSnakeBody,
	directionToVector,
	getNextPosition,
	isOutsideBounds,
	isSamePosition
} from './geometry';
import {
	createMapLayout,
	getGreedinessGatePhase,
	positionListIncludes,
	type GameMapLayout,
	type GatePhase
} from './maps';

export interface AppleFeedbackCue {
	id: number;
	type: AsianFeedbackAppleType;
	position: Position;
	placement: 'top' | 'bottom';
	lineIndex: number;
}

interface PinnedBodyState {
	pinnedAt: Position;
	pinnedBody: Position[];
	allowedCells: Position[];
	penaltyRatio: number;
}

export function useSnakeGame(difficulty: Readonly<Ref<Difficulty>>, mapId: Readonly<Ref<MapId>>) {
	const status = ref<GameStatus>('playing');
	const snakeBody = ref<Position[]>([]);
	const snakeDirection = ref<Direction>('right');
	const queuedDirection = ref<Direction>('right');
	const targetLength = ref(STARTING_SNAKE_LENGTH);
	const score = ref(0);
	const pointsMultiplier = ref(1.0);
	const activeEffects = ref<ActiveEffect[]>([]);
	const apples = ref<Apple[]>([]);
	const bonusChain = ref<BonusChainState | null>(null);
	const goldRushEndsAt = ref<number | null>(null);
	const iceAgeEndsAt = ref<number | null>(null);
	const gatePhase = ref<GatePhase | null>(null);
	const gateCycleStartedAt = ref(Date.now());
	const pinnedBodyState = ref<PinnedBodyState | null>(null);
	const gameLoop = ref<number | null>(null);
	const eventTimer = ref<number | null>(null);
	const showGameOver = ref(false);
	const renderVersion = ref(0);
	const appleFeedback = ref<AppleFeedbackCue | null>(null);

	let nextAppleId = 0;
	let nextAppleFeedbackId = 0;
	let appleFeedbackTimer: number | null = null;
	const iceAgeSpawnPool = (Object.keys(APPLE_SPAWN_WEIGHTS) as SpawnableAppleType[]).filter(
		(type) => type !== 'turbo'
	);

	const currentConfig = computed(() => DIFFICULTIES[difficulty.value]);
	const currentAppleCap = computed(() => MAX_APPLES_BY_DIFFICULTY[difficulty.value]);
	const mapWidth = computed(() => currentConfig.value.mapWidth);
	const mapHeight = computed(() => currentConfig.value.mapHeight);
	const activeMap = computed(() => createMapLayout(mapId.value, mapWidth.value, mapHeight.value));
	const currentTickMs = computed(() =>
		getCurrentTickMs(currentConfig.value.tickMs, activeEffects.value)
	);
	const displayMultiplier = computed(() =>
		getDisplayMultiplier(pointsMultiplier.value, activeEffects.value)
	);
	const isGhostActive = computed(() =>
		activeEffects.value.some((effect) => effect.type === 'ghost')
	);
	const isTurboActive = computed(() =>
		activeEffects.value.some((effect) => effect.type === 'turbo')
	);
	const isChillActive = computed(() =>
		activeEffects.value.some((effect) => effect.type === 'chill')
	);
	const bonusChainSteps = computed(() => getBonusChainSteps(bonusChain.value));
	const isGoldRushActive = computed(() => goldRushEndsAt.value !== null);
	const isIceAgeActive = computed(() => iceAgeEndsAt.value !== null);
	const activeEventType = computed<GameEventType | null>(() =>
		bonusChain.value
			? 'bonusChain'
			: isGoldRushActive.value
				? 'goldRush'
				: isIceAgeActive.value
					? 'iceAge'
					: null
	);
	const activeEventTheme = computed(() =>
		activeEventType.value ? GAME_EVENT_THEMES[activeEventType.value] : null
	);
	const bonusChainTargetAppleIds = computed(() => {
		const targetType = getCurrentBonusChainTarget(bonusChain.value);
		if (!targetType) {
			return [];
		}

		return apples.value.filter((apple) => apple.type === targetType).map((apple) => apple.id);
	});
	const activeEffectsList = computed(() => getActiveEffectsList(activeEffects.value));
	const pinnedBodyCells = computed(() => pinnedBodyState.value?.pinnedBody ?? []);
	const pinnedMovementCells = computed(() => pinnedBodyState.value?.allowedCells ?? []);

	function requestRender() {
		renderVersion.value += 1;
	}

	function clearAppleFeedback() {
		if (appleFeedbackTimer) {
			window.clearTimeout(appleFeedbackTimer);
			appleFeedbackTimer = null;
		}
		appleFeedback.value = null;
	}

	function showAppleFeedback(apple: Apple) {
		if (
			!isAsianDifficulty(difficulty.value) ||
			(apple.type !== 'chill' && apple.type !== 'rotten')
		) {
			return;
		}

		nextAppleFeedbackId += 1;
		const type = apple.type;
		appleFeedback.value = {
			id: nextAppleFeedbackId,
			type,
			position: {
				x: clamp(apple.position.x, 0, mapWidth.value - 1),
				y: clamp(apple.position.y, 0, mapHeight.value - 1)
			},
			placement: apple.position.y < mapHeight.value / 2 ? 'bottom' : 'top',
			lineIndex: getRandomMessageIndex(ASIAN_APPLE_FEEDBACK_LINE_COUNT[type])
		};

		if (appleFeedbackTimer) {
			window.clearTimeout(appleFeedbackTimer);
		}
		appleFeedbackTimer = window.setTimeout(() => {
			appleFeedback.value = null;
			appleFeedbackTimer = null;
		}, 1600);
	}

	function getNextAppleId() {
		nextAppleId += 1;
		return `apple-${nextAppleId}`;
	}

	function getGoldRushSpecialLifetimeMs() {
		return Math.max(
			1,
			Math.round(currentConfig.value.specialAppleLifetimeMs * GOLD_RUSH_SPECIAL_LIFETIME_MULTIPLIER)
		);
	}

	function getGoldRushRottenLifetimeMs() {
		return Math.max(1, Math.round(ROTTEN_APPLE_LIFETIME_MS * GOLD_RUSH_ROTTEN_LIFETIME_MULTIPLIER));
	}

	function getSpawnRules() {
		if (isGoldRushActive.value) {
			return {
				forcedType: 'golden' as const,
				specialAppleLifetimeMs: getGoldRushSpecialLifetimeMs(),
				rottenLifetimeMs: getGoldRushRottenLifetimeMs(),
				ignoreSpecialLimit: true,
				pool: undefined
			};
		}

		if (isIceAgeActive.value) {
			return {
				forcedType: getPendingBonusChainSpawnType(bonusChain.value, apples.value),
				specialAppleLifetimeMs: currentConfig.value.specialAppleLifetimeMs,
				rottenLifetimeMs: ROTTEN_APPLE_LIFETIME_MS,
				ignoreSpecialLimit: false,
				pool: iceAgeSpawnPool
			};
		}

		return {
			forcedType: getPendingBonusChainSpawnType(bonusChain.value, apples.value),
			specialAppleLifetimeMs: currentConfig.value.specialAppleLifetimeMs,
			rottenLifetimeMs: ROTTEN_APPLE_LIFETIME_MS,
			ignoreSpecialLimit: false,
			pool: undefined
		};
	}

	function getAppleBlockedCells() {
		return activeMap.value.appleBlockedCells;
	}

	function getCurrentGatePhase(now = Date.now()) {
		const layout = activeMap.value.greedinessGates;
		if (!layout) return null;
		return getGreedinessGatePhase(layout, now, gateCycleStartedAt.value);
	}

	function getPortalMove(position: Position, direction: Direction) {
		const portal = activeMap.value.portals.find((candidate) =>
			isSamePosition(candidate.position, position)
		);
		if (!portal) {
			return { position, direction };
		}
		return {
			position: { ...portal.pairedPosition },
			direction
		};
	}

	function isBlockedMapCell(position: Position, map: GameMapLayout = activeMap.value) {
		if (positionListIncludes(map.wallCells, position)) {
			return true;
		}

		const layout = map.greedinessGates;
		return (
			!!layout && gatePhase.value === 'closed' && positionListIncludes(layout.gateCells, position)
		);
	}

	function isClosedChamberCell(position: Position, map: GameMapLayout = activeMap.value) {
		const layout = map.greedinessGates;
		return (
			!!layout &&
			gatePhase.value === 'closed' &&
			positionListIncludes(layout.chamberCells, position)
		);
	}

	function isPositionOccupied(position: Position) {
		return (
			snakeBody.value.some((segment) => isSamePosition(segment, position)) ||
			apples.value.some((apple) => isSamePosition(apple.position, position))
		);
	}

	function removeGreedinessGateApples() {
		const nextApples = apples.value.filter((apple) => apple.source !== 'greedinessGate');
		if (nextApples.length === apples.value.length) {
			return false;
		}
		apples.value = nextApples;
		return true;
	}

	function spawnGreedinessGateApples(now: number) {
		const layout = activeMap.value.greedinessGates;
		if (!layout) return false;

		let didChange = false;
		for (const position of layout.goldenApplePositions) {
			if (isPositionOccupied(position)) {
				continue;
			}
			apples.value.push(
				buildApple({
					id: getNextAppleId(),
					type: 'golden',
					position,
					specialAppleLifetimeMs: layout.openMs + layout.warningMs + 1000,
					now,
					source: 'greedinessGate'
				})
			);
			didChange = true;
		}
		return didChange;
	}

	function createPinnedMovementArea(pinnedAt: Position, head: Position, activeLength: number) {
		const radius = Math.max(2, activeLength);
		const dxToHead = head.x - pinnedAt.x;
		const dyToHead = head.y - pinnedAt.y;
		const horizontal = Math.abs(dxToHead) >= Math.abs(dyToHead);
		const direction = horizontal ? Math.sign(dxToHead) || -1 : Math.sign(dyToHead) || -1;
		const cells: Position[] = [];

		for (let x = 0; x < mapWidth.value; x++) {
			for (let y = 0; y < mapHeight.value; y++) {
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

	function pinSnakeBodyAtClosingGate() {
		const layout = activeMap.value.greedinessGates;
		const head = snakeBody.value[0];
		if (!layout || !head) return;

		if (positionListIncludes(layout.gateCells, head)) {
			triggerGameOver();
			return;
		}

		const pinIndex = snakeBody.value.findIndex(
			(segment, index) => index > 0 && positionListIncludes(layout.gateCells, segment)
		);
		if (pinIndex < 0) return;

		const originalLength = snakeBody.value.length;
		const activeBody = snakeBody.value.slice(0, pinIndex);
		const pinnedBody = snakeBody.value.slice(pinIndex);
		const pinnedAt = { ...snakeBody.value[pinIndex]! };
		snakeBody.value = activeBody;
		targetLength.value = activeBody.length;
		pinnedBodyState.value = {
			pinnedAt,
			pinnedBody,
			allowedCells: createPinnedMovementArea(
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

	function failPinnedBody() {
		const pinned = pinnedBodyState.value;
		if (!pinned) return;
		const penalty = Math.round(score.value * pinned.penaltyRatio);
		score.value = Math.max(0, score.value - penalty);
		pinnedBodyState.value = null;
	}

	function setDirection(direction: Direction) {
		const currentVector = directionToVector(snakeDirection.value);
		const nextVector = directionToVector(direction);
		if (!areOpposite(currentVector, nextVector)) {
			queuedDirection.value = direction;
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		switch (event.key) {
			case 'w':
			case 'W':
			case 'ArrowUp':
				event.preventDefault();
				setDirection('up');
				break;
			case 's':
			case 'S':
			case 'ArrowDown':
				event.preventDefault();
				setDirection('down');
				break;
			case 'a':
			case 'A':
			case 'ArrowLeft':
				event.preventDefault();
				setDirection('left');
				break;
			case 'd':
			case 'D':
			case 'ArrowRight':
				event.preventDefault();
				setDirection('right');
				break;
		}
	}

	function fillApplesToCap() {
		while (
			apples.value.filter((apple) => apple.source !== 'greedinessGate').length <
			currentAppleCap.value
		) {
			const spawnRules = getSpawnRules();
			const newApple = spawnApple({
				snakeBody: snakeBody.value,
				apples: apples.value,
				mapWidth: mapWidth.value,
				mapHeight: mapHeight.value,
				blockedPositions: getAppleBlockedCells(),
				createId: getNextAppleId,
				specialAppleLifetimeMs: spawnRules.specialAppleLifetimeMs,
				rottenLifetimeMs: spawnRules.rottenLifetimeMs,
				forcedType: spawnRules.forcedType,
				ignoreSpecialLimit: spawnRules.ignoreSpecialLimit,
				pool: spawnRules.pool
			});
			if (!newApple) {
				break;
			}
			apples.value.push(newApple);
		}

		if (bonusChain.value) {
			apples.value = ensureCurrentBonusChainTargetAvailable({
				chain: bonusChain.value,
				apples: apples.value,
				createId: getNextAppleId,
				specialAppleLifetimeMs: currentConfig.value.specialAppleLifetimeMs
			});
		}
	}

	function startBonusChain() {
		if (activeEventType.value || status.value !== 'playing') {
			return;
		}

		const chain = createBonusChain(apples.value);
		if (!chain) {
			return;
		}

		bonusChain.value = chain;
		apples.value = ensureCurrentBonusChainTargetAvailable({
			chain: bonusChain.value,
			apples: apples.value,
			createId: getNextAppleId,
			specialAppleLifetimeMs: currentConfig.value.specialAppleLifetimeMs
		});
		requestRender();
	}

	function startGoldRush(now = Date.now()) {
		if (activeEventType.value || status.value !== 'playing') {
			return;
		}

		goldRushEndsAt.value = now + GOLD_RUSH_DURATION_MS;
		apples.value = normalizeSpawnableApples({
			apples: apples.value,
			type: 'golden',
			specialAppleLifetimeMs: getGoldRushSpecialLifetimeMs(),
			rottenLifetimeMs: getGoldRushRottenLifetimeMs(),
			now
		});
		fillApplesToCap();
		requestRender();
	}

	function startIceAge(now = Date.now()) {
		if (activeEventType.value || status.value !== 'playing') {
			return;
		}

		iceAgeEndsAt.value = now + ICE_AGE_DURATION_MS;
		activeEffects.value = applySpeedEffect(activeEffects.value, 'chill', ICE_AGE_DURATION_MS, now);
		apples.value = apples.value.map((apple) =>
			apple.type === 'turbo'
				? {
						...apple,
						type: 'chill'
					}
				: apple
		);
		requestRender();
	}

	function maybeTriggerGameEvent() {
		if (activeEventType.value || status.value !== 'playing') {
			return;
		}

		if (!shouldTriggerGameEvent()) {
			return;
		}

		const availableEvents: GameEventType[] = ['goldRush', 'iceAge'];
		if (apples.value.some((apple) => apple.type !== 'rotten')) {
			availableEvents.push('bonusChain');
		}

		const nextEvent = pickRandomGameEvent(availableEvents);
		if (nextEvent === 'bonusChain') {
			startBonusChain();
			return;
		}

		if (nextEvent === 'goldRush') {
			startGoldRush();
			return;
		}

		if (nextEvent === 'iceAge') {
			startIceAge();
		}
	}

	function clearEventTimer() {
		if (eventTimer.value) {
			clearTimeout(eventTimer.value);
			eventTimer.value = null;
		}
	}

	function scheduleEventCheck() {
		clearEventTimer();
		if (status.value !== 'playing') return;

		eventTimer.value = window.setTimeout(() => {
			maybeTriggerGameEvent();
			scheduleEventCheck();
		}, getRandomGameEventDelay());
	}

	function handleBonusChainAppleEat(eatenApple: Apple) {
		const result = advanceBonusChain(bonusChain.value, eatenApple.type);
		if (result.completed) {
			score.value += BONUS_CHAIN_COMPLETION_BONUS;
		}
		bonusChain.value = result.chain;
	}

	function applyEatenAppleEffect(eatenApple: Apple) {
		const now = Date.now();
		const multiplier = displayMultiplier.value;
		handleBonusChainAppleEat(eatenApple);

		const result = applyAppleEffect({
			apple: eatenApple,
			score: score.value,
			targetLength: targetLength.value,
			snakeBody: snakeBody.value,
			pointsMultiplier: pointsMultiplier.value,
			activeEffects: activeEffects.value,
			displayMultiplier: multiplier,
			iceAgeActive: isIceAgeActive.value,
			now
		});

		score.value = result.score;
		targetLength.value = result.targetLength;
		snakeBody.value = result.snakeBody;
		pointsMultiplier.value = result.pointsMultiplier;
		activeEffects.value = result.activeEffects;
		showAppleFeedback(eatenApple);
		apples.value = removeApple(apples.value, eatenApple.id);
		return result.extraForwardSteps;
	}

	function moveSnakeForwardOneTile() {
		const head = snakeBody.value[0];
		if (!head) {
			return null;
		}

		const nextPosition = getNextPosition(head, snakeDirection.value);
		const portalMove = getPortalMove(nextPosition, snakeDirection.value);
		if (!portalMove) {
			triggerGameOver();
			return null;
		}

		const newHead = portalMove.position;
		if (portalMove.direction !== snakeDirection.value) {
			snakeDirection.value = portalMove.direction;
			queuedDirection.value = portalMove.direction;
		}

		if (isOutsideBounds(newHead, mapWidth.value, mapHeight.value)) {
			triggerGameOver();
			return null;
		}

		if (isBlockedMapCell(newHead) || isClosedChamberCell(newHead)) {
			triggerGameOver();
			return null;
		}

		if (pinnedBodyState.value?.pinnedBody.some((segment) => isSamePosition(segment, newHead))) {
			triggerGameOver();
			return null;
		}

		if (collidesWithSnakeBody(newHead, snakeBody.value, targetLength.value, isGhostActive.value)) {
			triggerGameOver();
			return null;
		}

		snakeBody.value.unshift(newHead);
		while (snakeBody.value.length > targetLength.value) {
			snakeBody.value.pop();
		}

		if (
			pinnedBodyState.value &&
			!positionListIncludes(pinnedBodyState.value.allowedCells, newHead)
		) {
			failPinnedBody();
		}

		return apples.value.find((apple) => isSamePosition(newHead, apple.position)) ?? null;
	}

	function runMovementChain() {
		let pendingSteps = 1;
		let ateApple = false;

		while (pendingSteps > 0 && status.value === 'playing') {
			pendingSteps -= 1;
			const eatenApple = moveSnakeForwardOneTile();
			if (status.value !== 'playing') {
				return;
			}

			if (!eatenApple) {
				continue;
			}

			ateApple = true;
			pendingSteps += applyEatenAppleEffect(eatenApple);
		}

		if (ateApple) {
			fillApplesToCap();
		}
	}

	function checkExpiredEffects() {
		const result = clearExpiredEffects(activeEffects.value, pointsMultiplier.value);
		activeEffects.value = result.activeEffects;
		pointsMultiplier.value = result.pointsMultiplier;
	}

	function checkEventExpiry(now = Date.now()) {
		if (goldRushEndsAt.value && goldRushEndsAt.value <= now) {
			goldRushEndsAt.value = null;
			requestRender();
		}
		if (iceAgeEndsAt.value && iceAgeEndsAt.value <= now) {
			iceAgeEndsAt.value = null;
			requestRender();
		}
	}

	function checkMapState(now = Date.now()) {
		const nextGatePhase = getCurrentGatePhase(now);
		if (!nextGatePhase) {
			gatePhase.value = null;
			pinnedBodyState.value = null;
			return;
		}

		if (gatePhase.value === nextGatePhase) {
			return;
		}

		gatePhase.value = nextGatePhase;
		let didChange = false;
		if (nextGatePhase === 'open') {
			pinnedBodyState.value = null;
			didChange = spawnGreedinessGateApples(now) || didChange;
		}
		if (nextGatePhase === 'closed') {
			didChange = removeGreedinessGateApples() || didChange;
			const layout = activeMap.value.greedinessGates;
			const head = snakeBody.value[0];
			if (layout && head && positionListIncludes(layout.chamberCells, head)) {
				triggerGameOver();
				return;
			}
			pinSnakeBodyAtClosingGate();
		}

		if (didChange || status.value === 'playing') {
			requestRender();
		}
	}

	function updateApplesForExpiry(now = Date.now()) {
		const result = updateExpiredApples(apples.value, now);
		if (!result.didChange) {
			return;
		}

		apples.value = result.apples;
		fillApplesToCap();
	}

	function triggerGameOver() {
		status.value = 'gameOver';
		stopGame();
		showGameOver.value = true;
	}

	function updateGame() {
		const now = Date.now();
		checkEventExpiry(now);
		checkMapState(now);
		if (status.value !== 'playing') {
			return;
		}
		checkExpiredEffects();
		updateApplesForExpiry(now);

		snakeDirection.value = queuedDirection.value;
		runMovementChain();
		if (status.value !== 'playing') {
			return;
		}

		requestRender();
	}

	function scheduleNextTick() {
		if (status.value !== 'playing') return;
		gameLoop.value = window.setTimeout(() => {
			updateGame();
			scheduleNextTick();
		}, currentTickMs.value);
	}

	function stopGame() {
		if (gameLoop.value) {
			clearTimeout(gameLoop.value);
			gameLoop.value = null;
		}
		clearEventTimer();
		clearAppleFeedback();
	}

	function initGame() {
		stopGame();

		const centerX = Math.floor(mapWidth.value / 2);
		const centerY = Math.floor(mapHeight.value / 2);

		snakeBody.value = [
			{ x: centerX, y: centerY },
			{ x: centerX - 1, y: centerY },
			{ x: centerX - 2, y: centerY }
		];
		snakeDirection.value = 'right';
		queuedDirection.value = 'right';
		targetLength.value = STARTING_SNAKE_LENGTH;
		score.value = 0;
		pointsMultiplier.value = 1.0;
		activeEffects.value = [];
		clearAppleFeedback();
		apples.value = [];
		bonusChain.value = null;
		goldRushEndsAt.value = null;
		iceAgeEndsAt.value = null;
		gateCycleStartedAt.value = Date.now();
		gatePhase.value = getCurrentGatePhase(gateCycleStartedAt.value);
		pinnedBodyState.value = null;
		nextAppleId = 0;
		fillApplesToCap();
		status.value = 'playing';
		showGameOver.value = false;

		requestRender();
		scheduleNextTick();
		scheduleEventCheck();
	}

	function closeGameOver() {
		showGameOver.value = false;
	}

	return {
		status,
		snakeBody,
		snakeDirection,
		score,
		apples,
		bonusChain,
		showGameOver,
		currentConfig,
		mapWidth,
		mapHeight,
		activeMap,
		gatePhase,
		pinnedBodyCells,
		pinnedMovementCells,
		displayMultiplier,
		activeEventType,
		activeEventTheme,
		bonusChainTargetAppleIds,
		isGhostActive,
		isTurboActive,
		isChillActive,
		bonusChainSteps,
		activeEffectsList,
		appleFeedback,
		renderVersion,
		setDirection,
		handleKeydown,
		initGame,
		stopGame,
		closeGameOver
	};
}
