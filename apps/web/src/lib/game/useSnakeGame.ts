import type { Difficulty } from '@packages/types';
import { computed, ref, type Ref } from 'vue';

import {
	BONUS_CHAIN_COMPLETION_BONUS,
	DIFFICULTIES,
	MAX_APPLES_BY_DIFFICULTY,
	STARTING_SNAKE_LENGTH,
	type ActiveEffect,
	type Apple,
	type BonusChainState,
	type Direction,
	type GameStatus,
	type Position
} from '../data';
import { removeApple, spawnApple, updateExpiredApples } from './apples';
import {
	advanceBonusChain,
	createBonusChain,
	ensureCurrentBonusChainTargetAvailable,
	getBonusChainSteps,
	getPendingBonusChainSpawnType,
	getRandomBonusChainDelay,
	shouldTriggerBonusChain
} from './bonus-chain';
import {
	applyAppleEffect,
	clearExpiredEffects,
	getActiveEffectsList,
	getCurrentTickMs,
	getDisplayMultiplier
} from './effects';
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
	const gameLoop = ref<number | null>(null);
	const bonusChainTimer = ref<number | null>(null);
	const showGameOver = ref(false);
	const renderVersion = ref(0);

	let nextAppleId = 0;

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
	const activeEffectsList = computed(() => getActiveEffectsList(activeEffects.value));

	function requestRender() {
		renderVersion.value += 1;
	}

	function getNextAppleId() {
		nextAppleId += 1;
		return `apple-${nextAppleId}`;
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
			const newApple = spawnApple({
				snakeBody: snakeBody.value,
				apples: apples.value,
				mapWidth: mapWidth.value,
				mapHeight: mapHeight.value,
				createId: getNextAppleId,
				specialAppleLifetimeMs: currentConfig.value.specialAppleLifetimeMs,
				forcedType: getPendingBonusChainSpawnType(bonusChain.value, apples.value)
			});
			if (!newApple) {
				break;
			}
			apples.value.push(newApple);
		}

		apples.value = ensureCurrentBonusChainTargetAvailable({
			chain: bonusChain.value,
			apples: apples.value,
			createId: getNextAppleId,
			specialAppleLifetimeMs: currentConfig.value.specialAppleLifetimeMs
		});
	}

	function startBonusChain() {
		if (bonusChain.value || status.value !== 'playing') {
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

	function maybeTriggerBonusChain() {
		if (bonusChain.value || status.value !== 'playing') {
			return;
		}

		if (shouldTriggerBonusChain()) {
			startBonusChain();
		}
	}

	function clearBonusChainTimer() {
		if (bonusChainTimer.value) {
			clearTimeout(bonusChainTimer.value);
			bonusChainTimer.value = null;
		}
	}

	function scheduleBonusChainCheck() {
		clearBonusChainTimer();
		if (status.value !== 'playing') return;

		bonusChainTimer.value = window.setTimeout(() => {
			maybeTriggerBonusChain();
			scheduleBonusChainCheck();
		}, getRandomBonusChainDelay());
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
			now
		});

		score.value = result.score;
		targetLength.value = result.targetLength;
		snakeBody.value = result.snakeBody;
		pointsMultiplier.value = result.pointsMultiplier;
		activeEffects.value = result.activeEffects;
		apples.value = removeApple(apples.value, eatenApple.id);
		fillApplesToCap();
	}

	function checkExpiredEffects() {
		const result = clearExpiredEffects(activeEffects.value, pointsMultiplier.value);
		activeEffects.value = result.activeEffects;
		pointsMultiplier.value = result.pointsMultiplier;
	}

	function updateApplesForExpiry() {
		const result = updateExpiredApples(apples.value);
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
		checkExpiredEffects();
		updateApplesForExpiry();

		snakeDirection.value = queuedDirection.value;
		const head = snakeBody.value[0];
		if (!head) return;

		const newHead = getNextPosition(head, snakeDirection.value);
		if (isOutsideBounds(newHead, mapWidth.value, mapHeight.value)) {
			triggerGameOver();
			return;
		}

		if (collidesWithSnakeBody(newHead, snakeBody.value, targetLength.value, isGhostActive.value)) {
			triggerGameOver();
			return;
		}

		snakeBody.value.unshift(newHead);
		while (snakeBody.value.length > targetLength.value) {
			snakeBody.value.pop();
		}

		const eatenApple = apples.value.find((apple) => isSamePosition(newHead, apple.position));
		if (eatenApple) {
			applyEatenAppleEffect(eatenApple);
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
		clearBonusChainTimer();
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
		nextAppleId = 0;
		fillApplesToCap();
		status.value = 'playing';
		showGameOver.value = false;

		requestRender();
		scheduleNextTick();
		scheduleBonusChainCheck();
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
