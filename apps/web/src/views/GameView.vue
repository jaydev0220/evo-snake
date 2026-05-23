<script setup lang="ts">
	import { AppleIcon, ArrowLeft as ArrowLeftIcon } from '@lucide/vue';
	import { ref, onMounted, onUnmounted, computed, nextTick, watch } from 'vue';

	import ActiveEffectsPanel from '../components/ActiveEffectsPanel.vue';
	import BonusChainPanel from '../components/BonusChainPanel.vue';
	import GameOverDialog from '../components/GameOverDialog.vue';
	import GameStatusPanel from '../components/GameStatusPanel.vue';
	import OnScreenControlsPanel from '../components/OnScreenControlsPanel.vue';
	import {
		DIFFICULTIES,
		APPLE_COLORS,
		APPLE_SPAWN_WEIGHTS,
		BONUS_CHAIN_LENGTH,
		BONUS_CHAIN_TRIGGER_MIN_MS,
		BONUS_CHAIN_TRIGGER_MAX_MS,
		BONUS_CHAIN_TRIGGER_CHANCE,
		BASE_POINTS,
		BONUS_CHAIN_COMPLETION_BONUS,
		MAX_APPLES_BY_DIFFICULTY,
		MAX_SPECIAL_APPLES,
		MIN_SNAKE_LENGTH,
		STARTING_SNAKE_LENGTH,
		MIN_POINTS_MULTIPLIER,
		MAX_POINTS_MULTIPLIER,
		ROTTEN_APPLE_LIFETIME_MS,
		TURBO_DURATION_MS,
		TURBO_SPEED_MULTIPLIER,
		TURBO_POINTS_DELTA,
		CHILL_DURATION_MS,
		CHILL_SPEED_MULTIPLIER,
		CHILL_POINTS_DELTA,
		GHOST_DURATION_MS,
		SHRINK_LENGTH_DELTA,
		CLASSIC_LENGTH_DELTA,
		GOLDEN_SCORE_MULTIPLIER,
		SNAKE_COLORS,
		GRID_COLOR,
		BOARD_BG,
		EFFECT_LABELS,
		type Direction,
		type AppleType,
		type SpawnableAppleType,
		type GameStatus,
		type Position,
		type ActiveEffect,
		type Apple,
		type BonusChainState
	} from '../lib/data';
	import { useGameStore } from '../lib/stores/game';

	const emit = defineEmits<{
		back: [];
	}>();

	const store = useGameStore();

	const difficulty = computed(() => store.selectedDifficulty);
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
	const canvasRef = ref<HTMLCanvasElement | null>(null);
	const applePositions = ref<
		Array<{ id: string; type: AppleType; x: number; y: number; size: number }>
	>([]);

	const showGameOver = ref(false);
	const isUploading = ref(false);
	const uploadError = ref<string | null>(null);

	const currentConfig = computed(() => DIFFICULTIES[difficulty.value]);
	const currentAppleCap = computed(() => MAX_APPLES_BY_DIFFICULTY[difficulty.value]);
	const mapWidth = computed(() => currentConfig.value.mapWidth);
	const mapHeight = computed(() => currentConfig.value.mapHeight);
	const currentTickMs = computed(() => {
		const turbo = activeEffects.value.find((e) => e.type === 'turbo');
		const chill = activeEffects.value.find((e) => e.type === 'chill');
		const config = currentConfig.value;
		if (turbo) return config.tickMs / TURBO_SPEED_MULTIPLIER;
		if (chill) return config.tickMs / CHILL_SPEED_MULTIPLIER;
		return config.tickMs;
	});

	let nextAppleId = 0;

	const displayMultiplier = computed(() => {
		const turbo = activeEffects.value.find((e) => e.type === 'turbo');
		const chill = activeEffects.value.find((e) => e.type === 'chill');
		let m = pointsMultiplier.value;
		if (turbo) m += 0.5;
		if (chill) m -= 0.25;
		return clamp(m, MIN_POINTS_MULTIPLIER, MAX_POINTS_MULTIPLIER);
	});

	const isGhostActive = computed(() => activeEffects.value.some((e) => e.type === 'ghost'));
	const isTurboActive = computed(() => activeEffects.value.some((e) => e.type === 'turbo'));
	const isChillActive = computed(() => activeEffects.value.some((e) => e.type === 'chill'));
	const currentBonusChainTarget = computed<SpawnableAppleType | null>(() => {
		if (!bonusChain.value) return null;
		return bonusChain.value.steps[bonusChain.value.currentIndex] ?? null;
	});
	const bonusChainSteps = computed(() => {
		if (!bonusChain.value) return [];
		return bonusChain.value.steps.map((type, index) => ({
			type,
			index,
			isCompleted: index < bonusChain.value!.currentIndex,
			isCurrent: index === bonusChain.value!.currentIndex
		}));
	});

	const activeEffectsList = computed(() => {
		const now = Date.now();
		return activeEffects.value.map((e) => {
			const remaining = Math.max(0, Math.ceil((e.expiresAt - now) / 1000));
			const info = EFFECT_LABELS[e.type]!;
			return { ...e, label: info.label, color: info.color, remaining };
		});
	});

	function clamp(val: number, min: number, max: number) {
		return Math.min(Math.max(val, min), max);
	}

	function getNextAppleId() {
		nextAppleId += 1;
		return `apple-${nextAppleId}`;
	}

	function directionToVector(dir: Direction): Position {
		switch (dir) {
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

	function setDirection(dir: Direction) {
		const currentVec = directionToVector(snakeDirection.value);
		const newVec = directionToVector(dir);
		if (!areOpposite(currentVec, newVec)) {
			queuedDirection.value = dir;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		switch (e.key) {
			case 'w':
			case 'W':
			case 'ArrowUp':
				e.preventDefault();
				setDirection('up');
				break;
			case 's':
			case 'S':
			case 'ArrowDown':
				e.preventDefault();
				setDirection('down');
				break;
			case 'a':
			case 'A':
			case 'ArrowLeft':
				e.preventDefault();
				setDirection('left');
				break;
			case 'd':
			case 'D':
			case 'ArrowRight':
				e.preventDefault();
				setDirection('right');
				break;
		}
	}

	function isSpecialAppleType(type: AppleType): type is Exclude<AppleType, 'classic' | 'rotten'> {
		return type !== 'classic' && type !== 'rotten';
	}

	function getRandomWeightedType(
		pool: SpawnableAppleType[] = Object.keys(APPLE_SPAWN_WEIGHTS) as SpawnableAppleType[]
	) {
		const totalWeight = pool.reduce((sum, type) => sum + APPLE_SPAWN_WEIGHTS[type], 0);
		let random = Math.random() * totalWeight;

		for (const type of pool) {
			random -= APPLE_SPAWN_WEIGHTS[type];
			if (random <= 0) {
				return type;
			}
		}

		return pool[0] ?? 'classic';
	}

	function getRandomBonusChainDelay() {
		const range = BONUS_CHAIN_TRIGGER_MAX_MS - BONUS_CHAIN_TRIGGER_MIN_MS;
		return BONUS_CHAIN_TRIGGER_MIN_MS + Math.round(Math.random() * range);
	}

	function getRandomEmptyCell(): Position | null {
		const occupied = new Set(snakeBody.value.map((p) => `${p.x},${p.y}`));
		for (const apple of apples.value) {
			occupied.add(`${apple.position.x},${apple.position.y}`);
		}

		const emptyCells: Position[] = [];
		for (let x = 0; x < mapWidth.value; x++) {
			for (let y = 0; y < mapHeight.value; y++) {
				if (!occupied.has(`${x},${y}`)) {
					emptyCells.push({ x, y });
				}
			}
		}

		if (emptyCells.length === 0) return null;
		return emptyCells[Math.floor(Math.random() * emptyCells.length)]!;
	}

	function chooseSpawnType(): SpawnableAppleType {
		const specialAppleCount = apples.value.filter((apple) => isSpecialAppleType(apple.type)).length;
		if (specialAppleCount >= MAX_SPECIAL_APPLES) {
			return 'classic';
		}

		return getRandomWeightedType();
	}

	function buildApple(type: AppleType, position: Position, now = Date.now()): Apple {
		const expiresAt =
			type === 'rotten'
				? now + ROTTEN_APPLE_LIFETIME_MS
				: isSpecialAppleType(type)
					? now + currentConfig.value.specialAppleLifetimeMs
					: null;

		return {
			id: getNextAppleId(),
			type,
			position,
			spawnedAt: now,
			expiresAt
		};
	}

	function canSpawnForcedType(type: SpawnableAppleType) {
		if (!isSpecialAppleType(type)) {
			return true;
		}

		const specialAppleCount = apples.value.filter((apple) => isSpecialAppleType(apple.type)).length;
		return specialAppleCount < MAX_SPECIAL_APPLES;
	}

	function getPendingBonusChainSpawnType() {
		const target = currentBonusChainTarget.value;
		if (!target) return null;
		if (apples.value.some((apple) => apple.type === target)) return null;
		return target;
	}

	function spawnApple(forcedType?: SpawnableAppleType | null): Apple | null {
		const position = getRandomEmptyCell();
		if (!position) {
			return null;
		}

		const type = forcedType && canSpawnForcedType(forcedType) ? forcedType : chooseSpawnType();
		const now = Date.now();
		return buildApple(type, position, now);
	}

	function findBonusChainReplacementIndex(target: SpawnableAppleType) {
		const candidateIndexes = apples.value
			.map((apple, index) => ({ apple, index }))
			.filter(({ apple }) => apple.type !== target);
		if (candidateIndexes.length === 0) {
			return -1;
		}

		const targetIsSpecial = isSpecialAppleType(target);
		candidateIndexes.sort((a, b) => {
			const aPriority = getBonusChainReplacementPriority(a.apple.type, targetIsSpecial);
			const bPriority = getBonusChainReplacementPriority(b.apple.type, targetIsSpecial);
			return aPriority - bPriority;
		});

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

	function ensureCurrentBonusChainTargetAvailable() {
		const target = currentBonusChainTarget.value;
		if (!target) return;
		if (apples.value.some((apple) => apple.type === target)) return;

		const replacementIndex = findBonusChainReplacementIndex(target);
		if (replacementIndex < 0) return;

		const replacement = apples.value[replacementIndex];
		if (!replacement) return;

		const nextApple = buildApple(target, replacement.position);
		apples.value = apples.value.map((apple, index) =>
			index === replacementIndex ? { ...nextApple, id: apple.id } : apple
		);
	}

	function fillApplesToCap() {
		while (apples.value.length < currentAppleCap.value) {
			const newApple = spawnApple(getPendingBonusChainSpawnType());
			if (!newApple) {
				break;
			}
			apples.value.push(newApple);
		}

		ensureCurrentBonusChainTargetAvailable();
	}

	function removeApple(id: string) {
		apples.value = apples.value.filter((apple) => apple.id !== id);
	}

	function clearBonusChain() {
		bonusChain.value = null;
	}

	function startBonusChain() {
		if (bonusChain.value || status.value !== 'playing') {
			return;
		}

		const availableTypes = apples.value
			.filter((apple) => apple.type !== 'rotten')
			.map((apple) => apple.type as SpawnableAppleType);
		if (availableTypes.length === 0) {
			return;
		}

		const firstStep = availableTypes[Math.floor(Math.random() * availableTypes.length)];
		if (!firstStep) {
			return;
		}

		const steps: SpawnableAppleType[] = [firstStep];
		while (steps.length < BONUS_CHAIN_LENGTH) {
			steps.push(getRandomWeightedType());
		}

		bonusChain.value = {
			steps,
			currentIndex: 0,
			startedAt: Date.now()
		};

		ensureCurrentBonusChainTargetAvailable();
	}

	function maybeTriggerBonusChain() {
		if (bonusChain.value || status.value !== 'playing') {
			return;
		}

		if (Math.random() <= BONUS_CHAIN_TRIGGER_CHANCE) {
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
		const chain = bonusChain.value;
		const target = currentBonusChainTarget.value;
		if (!chain || !target) {
			return;
		}

		if (eatenApple.type !== target) {
			clearBonusChain();
			return;
		}

		if (chain.currentIndex >= chain.steps.length - 1) {
			score.value += BONUS_CHAIN_COMPLETION_BONUS;
			clearBonusChain();
			return;
		}

		bonusChain.value = {
			...chain,
			currentIndex: chain.currentIndex + 1
		};
	}

	function replaceSpeedEffect(type: 'turbo' | 'chill', durationMs: number, pointsDelta: number) {
		activeEffects.value = activeEffects.value.filter(
			(e) => e.type !== 'turbo' && e.type !== 'chill'
		);
		activeEffects.value.push({
			type,
			startedAt: Date.now(),
			durationMs,
			expiresAt: Date.now() + durationMs
		});
		pointsMultiplier.value = clamp(
			pointsMultiplier.value + pointsDelta,
			MIN_POINTS_MULTIPLIER,
			MAX_POINTS_MULTIPLIER
		);
	}

	function refreshGhostEffect(durationMs: number) {
		const existing = activeEffects.value.find((e) => e.type === 'ghost');
		if (existing) {
			existing.expiresAt = Date.now() + durationMs;
			existing.durationMs = durationMs;
		} else {
			activeEffects.value.push({
				type: 'ghost',
				startedAt: Date.now(),
				durationMs,
				expiresAt: Date.now() + durationMs
			});
		}
	}

	function applyAppleEffect(eatenApple: Apple) {
		const mult = displayMultiplier.value;
		handleBonusChainAppleEat(eatenApple);

		switch (eatenApple.type) {
			case 'classic':
				score.value += Math.round(BASE_POINTS * mult);
				targetLength.value += CLASSIC_LENGTH_DELTA;
				break;
			case 'shrink':
				targetLength.value = Math.max(MIN_SNAKE_LENGTH, targetLength.value + SHRINK_LENGTH_DELTA);
				while (snakeBody.value.length > targetLength.value) {
					snakeBody.value.pop();
				}
				break;
			case 'turbo':
				score.value += Math.round(BASE_POINTS * mult);
				targetLength.value += CLASSIC_LENGTH_DELTA;
				replaceSpeedEffect('turbo', TURBO_DURATION_MS, TURBO_POINTS_DELTA);
				break;
			case 'chill':
				score.value += Math.round(BASE_POINTS * mult);
				targetLength.value += CLASSIC_LENGTH_DELTA;
				replaceSpeedEffect('chill', CHILL_DURATION_MS, CHILL_POINTS_DELTA);
				break;
			case 'ghost':
				score.value += Math.round(BASE_POINTS * mult);
				targetLength.value += CLASSIC_LENGTH_DELTA;
				refreshGhostEffect(GHOST_DURATION_MS);
				break;
			case 'golden':
				score.value += Math.round(BASE_POINTS * mult * GOLDEN_SCORE_MULTIPLIER);
				break;
			case 'rotten':
				score.value = Math.max(0, score.value - BASE_POINTS);
				break;
		}

		removeApple(eatenApple.id);
		fillApplesToCap();
	}

	function checkExpiredEffects() {
		const now = Date.now();
		const expired = activeEffects.value.filter((e) => e.expiresAt <= now);

		for (const effect of expired) {
			if (effect.type === 'turbo') {
				pointsMultiplier.value = clamp(
					pointsMultiplier.value - 0.5,
					MIN_POINTS_MULTIPLIER,
					MAX_POINTS_MULTIPLIER
				);
			} else if (effect.type === 'chill') {
				pointsMultiplier.value = clamp(
					pointsMultiplier.value + 0.25,
					MIN_POINTS_MULTIPLIER,
					MAX_POINTS_MULTIPLIER
				);
			}
		}

		activeEffects.value = activeEffects.value.filter((e) => e.expiresAt > now);
	}

	function updateExpiredApples() {
		const now = Date.now();
		let didChange = false;
		const nextApples: Apple[] = [];

		for (const apple of apples.value) {
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
					expiresAt: now + ROTTEN_APPLE_LIFETIME_MS
				});
			}
		}

		if (!didChange) {
			return;
		}

		apples.value = nextApples;
		fillApplesToCap();
	}

	function resizeCanvas() {
		const canvas = canvasRef.value;
		if (!canvas) return;
		const parent = canvas.parentElement;
		if (!parent) return;
		const rect = parent.getBoundingClientRect();
		canvas.width = rect.width;
		canvas.height = rect.height;
	}

	function drawGame() {
		const canvas = canvasRef.value;
		if (!canvas) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const cellWidth = canvas.width / mapWidth.value;
		const cellHeight = canvas.height / mapHeight.value;

		ctx.fillStyle = BOARD_BG;
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		ctx.strokeStyle = GRID_COLOR;
		ctx.lineWidth = 1;
		for (let i = 0; i <= mapWidth.value; i++) {
			ctx.beginPath();
			ctx.moveTo(i * cellWidth, 0);
			ctx.lineTo(i * cellWidth, canvas.height);
			ctx.stroke();
		}
		for (let i = 0; i <= mapHeight.value; i++) {
			ctx.beginPath();
			ctx.moveTo(0, i * cellHeight);
			ctx.lineTo(canvas.width, i * cellHeight);
			ctx.stroke();
		}

		const snakeColor = isGhostActive.value
			? SNAKE_COLORS.ghost
			: isTurboActive.value
				? SNAKE_COLORS.turbo
				: isChillActive.value
					? SNAKE_COLORS.chill
					: SNAKE_COLORS.normal;

		for (let i = 0; i < snakeBody.value.length; i++) {
			const segment = snakeBody.value[i]!;
			ctx.fillStyle = snakeColor;
			if (isGhostActive.value) {
				ctx.globalAlpha = 0.4;
			}
			ctx.fillRect(
				segment.x * cellWidth + 2,
				segment.y * cellHeight + 2,
				cellWidth - 4,
				cellHeight - 4
			);
			ctx.globalAlpha = 1;
		}

		const head = snakeBody.value[0];
		if (head) {
			ctx.fillStyle = '#ffffff';
			const eyeOffsetX = cellWidth * 0.2;
			const eyeOffsetY = cellHeight * 0.2;
			const eyeRadius = Math.min(cellWidth, cellHeight) * 0.1;

			const dirVec = directionToVector(snakeDirection.value);
			let eye1X: number, eye1Y: number, eye2X: number, eye2Y: number;

			if (dirVec.x !== 0) {
				eye1X = head.x * cellWidth + cellWidth * 0.5 + dirVec.x * eyeOffsetX;
				eye1Y = head.y * cellHeight + cellHeight * 0.3;
				eye2X = head.x * cellWidth + cellWidth * 0.5 + dirVec.x * eyeOffsetX;
				eye2Y = head.y * cellHeight + cellHeight * 0.7;
			} else {
				eye1X = head.x * cellWidth + cellWidth * 0.3;
				eye1Y = head.y * cellHeight + cellHeight * 0.5 + dirVec.y * eyeOffsetY;
				eye2X = head.x * cellWidth + cellWidth * 0.7;
				eye2Y = head.y * cellHeight + cellHeight * 0.5 + dirVec.y * eyeOffsetY;
			}

			ctx.beginPath();
			ctx.arc(eye1X, eye1Y, eyeRadius, 0, Math.PI * 2);
			ctx.fill();
			ctx.beginPath();
			ctx.arc(eye2X, eye2Y, eyeRadius, 0, Math.PI * 2);
			ctx.fill();
		}

		const cellPctX = 100 / mapWidth.value;
		const cellPctY = 100 / mapHeight.value;
		applePositions.value = apples.value.map((apple) => ({
			id: apple.id,
			type: apple.type,
			x: apple.position.x * cellPctX + cellPctX / 2,
			y: apple.position.y * cellPctY + cellPctY / 2,
			size: Math.min(cellPctX, cellPctY)
		}));
	}

	function triggerGameOver() {
		status.value = 'gameOver';
		stopGame();
		showGameOver.value = true;
	}

	function updateGame() {
		checkExpiredEffects();
		updateExpiredApples();

		snakeDirection.value = queuedDirection.value;
		const dirVec = directionToVector(snakeDirection.value);
		const head = snakeBody.value[0];
		if (!head) return;

		const newHead: Position = {
			x: head.x + dirVec.x,
			y: head.y + dirVec.y
		};

		if (
			newHead.x < 0 ||
			newHead.x >= mapWidth.value ||
			newHead.y < 0 ||
			newHead.y >= mapHeight.value
		) {
			triggerGameOver();
			return;
		}

		const willMoveTail = snakeBody.value.length >= targetLength.value;
		const collisionBody = willMoveTail ? snakeBody.value.slice(0, -1) : snakeBody.value;
		if (!isGhostActive.value) {
			for (const segment of collisionBody) {
				if (segment.x === newHead.x && segment.y === newHead.y) {
					triggerGameOver();
					return;
				}
			}
		}

		snakeBody.value.unshift(newHead);
		while (snakeBody.value.length > targetLength.value) {
			snakeBody.value.pop();
		}

		const eatenApple = apples.value.find(
			(apple) => newHead.x === apple.position.x && newHead.y === apple.position.y
		);
		if (eatenApple) {
			applyAppleEffect(eatenApple);
		}

		drawGame();
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
		isUploading.value = false;
		uploadError.value = null;

		resizeCanvas();
		drawGame();

		scheduleNextTick();
		scheduleBonusChainCheck();
	}

	async function handleUploadScore() {
		isUploading.value = true;
		uploadError.value = null;
		try {
			await store.postScore(score.value, difficulty.value);
		} catch (err) {
			uploadError.value = err instanceof Error ? err.message : 'Failed to upload score';
		} finally {
			isUploading.value = false;
		}
	}

	function handleCloseGameOver() {
		showGameOver.value = false;
		emit('back');
	}

	function handlePlayAgain() {
		showGameOver.value = false;
		initGame();
	}

	watch(showGameOver, async (open) => {
		if (open) {
			await nextTick();
			await handleUploadScore();
		}
	});

	onMounted(() => {
		window.addEventListener('keydown', handleKeydown);
		window.addEventListener('resize', resizeCanvas);
		initGame();
	});

	onUnmounted(() => {
		window.removeEventListener('keydown', handleKeydown);
		window.removeEventListener('resize', resizeCanvas);
		stopGame();
	});
</script>

<template>
	<main
		class="bg-evosnake-bg text-evosnake-text grid min-h-screen place-items-start px-4 py-5 md:place-items-center md:px-6"
	>
		<section
			class="grid w-full max-w-245 gap-4"
			aria-label="EvoSnake game view"
		>
			<div class="flex items-center gap-2">
				<button
					type="button"
					class="rounded-evosnake border-evosnake-border bg-evosnake-surface text-evosnake-muted hover:border-evosnake-primary hover:text-evosnake-text flex items-center gap-1 border px-3 py-2 text-sm transition-colors"
					@click="emit('back')"
				>
					<ArrowLeftIcon
						class="h-4 w-4"
						aria-hidden="true"
					/>
					Back to Menu
				</button>
			</div>

			<section
				class="grid items-end gap-4 lg:grid-cols-[minmax(0,1fr)_220px]"
				aria-label="Game play area"
			>
				<div class="grid min-w-0 gap-4">
					<GameStatusPanel
						:score="score"
						:multiplier="displayMultiplier"
						:mode-label="currentConfig.label"
					/>

					<section
						class="rounded-evosnakePanel border-evosnake-border bg-evosnake-surface shadow-evosnakePanel border p-2.5 md:p-3.5"
						aria-label="Game board container"
					>
						<div
							class="rounded-evosnake border-evosnake-border bg-evosnake-surface2 relative aspect-square w-full overflow-hidden border"
							aria-label="Square game area"
						>
							<canvas
								ref="canvasRef"
								class="block size-full"
							/>

							<div
								v-for="applePosition in applePositions"
								:key="applePosition.id"
								class="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
								:style="{ left: `${applePosition.x}%`, top: `${applePosition.y}%` }"
							>
								<AppleIcon
									:size="Math.round(applePosition.size * 4)"
									:color="APPLE_COLORS[applePosition.type].outline"
									:fill="APPLE_COLORS[applePosition.type].fill"
								/>
							</div>
						</div>
					</section>
				</div>

				<div class="grid min-w-0 gap-4">
					<ActiveEffectsPanel
						v-if="activeEffectsList.length > 0"
						:effects="activeEffectsList"
					/>

					<BonusChainPanel
						v-if="bonusChain"
						:steps="bonusChainSteps"
						:bonus-amount="BONUS_CHAIN_COMPLETION_BONUS"
					/>

					<OnScreenControlsPanel @move="setDirection" />
				</div>
			</section>
		</section>

		<GameOverDialog
			:open="showGameOver"
			:score="score"
			:mode-label="currentConfig.label"
			:length="snakeBody.length"
			:is-uploading="isUploading"
			:upload-error="uploadError"
			@close="handleCloseGameOver"
			@play-again="handlePlayAgain"
		/>
	</main>
</template>
