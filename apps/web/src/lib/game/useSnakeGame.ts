import type { Difficulty } from '@packages/types';
import { computed, ref, type Ref } from 'vue';

import {
	APPLE_SPAWN_WEIGHTS,
	BONUS_CHAIN_COMPLETION_BONUS,
	DIFFICULTIES,
	GAME_EVENT_THEMES,
	GOLD_RUSH_DURATION_MS,
	GOLD_RUSH_ROTTEN_LIFETIME_MULTIPLIER,
	GOLD_RUSH_SPECIAL_LIFETIME_MULTIPLIER,
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
import { normalizeSpawnableApples, removeApple, spawnApple, updateExpiredApples } from './apples';
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
	collidesWithSnakeBody,
	directionToVector,
	getNextPosition,
	isOutsideBounds,
	isSamePosition
} from './geometry';

export function useSnakeGame(difficulty: Readonly<Ref<Difficulty>>) {
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
	const gameLoop = ref<number | null>(null);
	const eventTimer = ref<number | null>(null);
	const showGameOver = ref(false);
	const renderVersion = ref(0);

	let nextAppleId = 0;
	const iceAgeSpawnPool = (Object.keys(APPLE_SPAWN_WEIGHTS) as SpawnableAppleType[]).filter(
		(type) => type !== 'turbo'
	);

	const currentConfig = computed(() => DIFFICULTIES[difficulty.value]);
	const currentAppleCap = computed(() => MAX_APPLES_BY_DIFFICULTY[difficulty.value]);
	const mapWidth = computed(() => currentConfig.value.mapWidth);
	const mapHeight = computed(() => currentConfig.value.mapHeight);
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

	function requestRender() {
		renderVersion.value += 1;
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
		while (apples.value.length < currentAppleCap.value) {
			const spawnRules = getSpawnRules();
			const newApple = spawnApple({
				snakeBody: snakeBody.value,
				apples: apples.value,
				mapWidth: mapWidth.value,
				mapHeight: mapHeight.value,
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
		apples.value = removeApple(apples.value, eatenApple.id);
		return result.extraForwardSteps;
	}

	function moveSnakeForwardOneTile() {
		const head = snakeBody.value[0];
		if (!head) {
			return null;
		}

		const newHead = getNextPosition(head, snakeDirection.value);
		if (isOutsideBounds(newHead, mapWidth.value, mapHeight.value)) {
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
		apples.value = [];
		bonusChain.value = null;
		goldRushEndsAt.value = null;
		iceAgeEndsAt.value = null;
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
		displayMultiplier,
		activeEventType,
		activeEventTheme,
		bonusChainTargetAppleIds,
		isGhostActive,
		isTurboActive,
		isChillActive,
		bonusChainSteps,
		activeEffectsList,
		renderVersion,
		setDirection,
		handleKeydown,
		initGame,
		stopGame,
		closeGameOver
	};
}
