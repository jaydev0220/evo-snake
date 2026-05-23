<script setup lang="ts">
	import {
		Apple as AppleIcon,
		ArrowDown,
		ArrowLeft as ArrowLeftIcon,
		ArrowRight,
		ArrowUp,
		Trophy,
		X
	} from '@lucide/vue';
	import { ref, onMounted, onUnmounted, computed, nextTick, watch } from 'vue';

	import {
		DIFFICULTIES,
		APPLE_COLORS,
		APPLE_SPAWN_WEIGHTS,
		BASE_POINTS,
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
		type Apple
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
	const gameLoop = ref<number | null>(null);
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

		const totalWeight = Object.values(APPLE_SPAWN_WEIGHTS).reduce((sum, weight) => sum + weight, 0);
		let random = Math.random() * totalWeight;

		for (const [type, weight] of Object.entries(APPLE_SPAWN_WEIGHTS) as Array<
			[SpawnableAppleType, number]
		>) {
			random -= weight;
			if (random <= 0) {
				return type;
			}
		}

		return 'classic';
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

	function spawnApple(): Apple | null {
		const position = getRandomEmptyCell();
		if (!position) {
			return null;
		}

		const type = chooseSpawnType();
		const now = Date.now();
		return buildApple(type, position, now);
	}

	function fillApplesToCap() {
		while (apples.value.length < currentAppleCap.value) {
			const newApple = spawnApple();
			if (!newApple) {
				break;
			}
			apples.value.push(newApple);
		}
	}

	function removeApple(id: string) {
		apples.value = apples.value.filter((apple) => apple.id !== id);
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
	}

	function initGame() {
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
		nextAppleId = 0;
		fillApplesToCap();
		status.value = 'playing';
		showGameOver.value = false;
		isUploading.value = false;
		uploadError.value = null;

		resizeCanvas();
		drawGame();

		scheduleNextTick();
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
					<section
						class="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-2.5"
						aria-label="Game status"
					>
						<div
							class="rounded-evosnake border-evosnake-border bg-evosnake-surface shadow-evosnakeCard grid min-h-16 content-center gap-1 border px-3.5 py-3"
						>
							<div class="text-evosnake-muted text-xs font-extrabold tracking-wider uppercase">
								Score
							</div>
							<div class="text-evosnake-text truncate text-lg font-black tracking-[-0.03em]">
								{{ score.toLocaleString() }}
							</div>
						</div>

						<div
							class="rounded-evosnake border-evosnake-border bg-evosnake-surface shadow-evosnakeCard grid min-h-16 content-center gap-1 border px-3.5 py-3"
						>
							<div class="text-evosnake-muted text-xs font-extrabold tracking-wider uppercase">
								Multiplier
							</div>
							<div class="text-evosnake-text truncate text-lg font-black tracking-[-0.03em]">
								x{{ displayMultiplier.toFixed(2) }}
							</div>
						</div>

						<div
							class="rounded-evosnake border-evosnake-border bg-evosnake-surface shadow-evosnakeCard grid min-h-16 content-center gap-1 border px-3.5 py-3"
						>
							<div class="text-evosnake-muted text-xs font-extrabold tracking-wider uppercase">
								Mode
							</div>
							<div class="text-evosnake-text truncate text-lg font-black tracking-[-0.03em]">
								{{ currentConfig.label }}
							</div>
						</div>
					</section>

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
					<section
						v-if="activeEffectsList.length > 0"
						class="rounded-evosnakePanel border-evosnake-border bg-evosnake-surface shadow-evosnakeCard border p-3.5 md:p-4.5"
						aria-label="Active effects"
					>
						<div class="text-evosnake-muted mb-2 text-xs font-extrabold tracking-wider uppercase">
							Active Effects
						</div>
						<div class="grid gap-1.5">
							<div
								v-for="effect in activeEffectsList"
								:key="effect.type"
								class="rounded-evosnake border-evosnake-border bg-evosnake-surface2 flex items-center justify-between border px-3 py-1.5"
							>
								<div class="flex items-center gap-2">
									<AppleIcon
										:size="14"
										:color="effect.color"
										aria-hidden="true"
									/>
									<span class="text-evosnake-text text-sm font-bold">{{ effect.label }}</span>
								</div>
								<span class="text-evosnake-muted font-mono text-xs">{{ effect.remaining }}s</span>
							</div>
						</div>
					</section>

					<section
						class="rounded-evosnakePanel border-evosnake-border bg-evosnake-surface shadow-evosnakeCard grid justify-center border p-3.5 md:p-4.5"
						aria-label="On-screen controls"
					>
						<div class="grid grid-cols-3 grid-rows-2 gap-2">
							<button
								class="arrow-key rounded-evosnake border-evosnake-border bg-evosnake-surface2 text-evosnake-text hover:border-evosnake-primary hover:bg-evosnake-surface3 active:bg-evosnake-primary col-start-2 row-start-1 grid size-13.5 touch-manipulation place-items-center border text-2xl font-black select-none active:text-[#08100b] md:size-14.5"
								type="button"
								aria-label="Move up"
								@click="setDirection('up')"
							>
								<ArrowUp :size="20" />
							</button>
							<button
								class="arrow-key rounded-evosnake border-evosnake-border bg-evosnake-surface2 text-evosnake-text hover:border-evosnake-primary hover:bg-evosnake-surface3 active:bg-evosnake-primary col-start-1 row-start-2 grid size-13.5 touch-manipulation place-items-center border text-2xl font-black select-none active:text-[#08100b] md:size-14.5"
								type="button"
								aria-label="Move left"
								@click="setDirection('left')"
							>
								<ArrowLeftIcon :size="20" />
							</button>
							<button
								class="arrow-key rounded-evosnake border-evosnake-border bg-evosnake-surface2 text-evosnake-text hover:border-evosnake-primary hover:bg-evosnake-surface3 active:bg-evosnake-primary col-start-2 row-start-2 grid size-13.5 touch-manipulation place-items-center border text-2xl font-black select-none active:text-[#08100b] md:size-14.5"
								type="button"
								aria-label="Move down"
								@click="setDirection('down')"
							>
								<ArrowDown :size="20" />
							</button>
							<button
								class="arrow-key rounded-evosnake border-evosnake-border bg-evosnake-surface2 text-evosnake-text hover:border-evosnake-primary hover:bg-evosnake-surface3 active:bg-evosnake-primary col-start-3 row-start-2 grid size-13.5 touch-manipulation place-items-center border text-2xl font-black select-none active:text-[#08100b] md:size-14.5"
								type="button"
								aria-label="Move right"
								@click="setDirection('right')"
							>
								<ArrowRight :size="20" />
							</button>
						</div>
					</section>
				</div>
			</section>
		</section>

		<Teleport to="body">
			<div
				v-if="showGameOver"
				class="fixed inset-0 z-50 grid place-items-center bg-black/70 px-4 py-5"
			>
				<section
					role="dialog"
					aria-modal="true"
					aria-labelledby="game-over-title"
					class="rounded-evosnakePanel border-evosnake-border bg-evosnake-surface shadow-evosnakePanel w-full max-w-md border p-6"
				>
					<div class="mb-4 flex items-center justify-between">
						<h2
							id="game-over-title"
							class="text-evosnake-text flex items-center gap-2 text-xl font-extrabold"
						>
							<Trophy
								class="text-evosnake-primary h-6 w-6"
								aria-hidden="true"
							/>
							Game Over
						</h2>
						<button
							type="button"
							aria-label="Close game over"
							class="text-evosnake-muted hover:text-evosnake-text rounded-lg p-1"
							@click="handleCloseGameOver"
						>
							<X
								class="h-5 w-5"
								aria-hidden="true"
							/>
						</button>
					</div>

					<div class="mb-5 grid gap-3">
						<div
							class="rounded-evosnake border-evosnake-border bg-evosnake-surface2 grid gap-1 border px-4 py-3"
						>
							<div class="text-evosnake-muted text-xs font-extrabold tracking-wider uppercase">
								Final Score
							</div>
							<div class="text-evosnake-text text-2xl font-black">
								{{ score.toLocaleString() }}
							</div>
						</div>

						<div class="grid grid-cols-2 gap-3">
							<div
								class="rounded-evosnake border-evosnake-border bg-evosnake-surface2 grid gap-1 border px-3 py-2.5"
							>
								<div class="text-evosnake-muted text-xs font-extrabold tracking-wider uppercase">
									Mode
								</div>
								<div class="text-evosnake-text text-sm font-bold">
									{{ currentConfig.label }}
								</div>
							</div>
							<div
								class="rounded-evosnake border-evosnake-border bg-evosnake-surface2 grid gap-1 border px-3 py-2.5"
							>
								<div class="text-evosnake-muted text-xs font-extrabold tracking-wider uppercase">
									Length
								</div>
								<div class="text-evosnake-text text-sm font-bold">
									{{ snakeBody.length }}
								</div>
							</div>
						</div>

						<div
							v-if="uploadError"
							class="rounded-evosnake border-evosnake-danger bg-evosnake-danger/10 text-evosnake-danger border px-3 py-2 text-sm"
						>
							{{ uploadError }}
						</div>
						<div
							v-else-if="isUploading"
							class="text-evosnake-muted text-center text-sm"
						>
							Uploading score...
						</div>
						<div
							v-else
							class="text-evosnake-primary text-center text-sm"
						>
							Score uploaded
						</div>
					</div>

					<div class="grid grid-cols-2 gap-3">
						<button
							type="button"
							class="rounded-evosnake bg-evosnake-primary hover:bg-evosnake-primaryHover px-4 py-2.5 font-bold text-[#08100b] transition-colors"
							@click="handlePlayAgain"
						>
							Play Again
						</button>
						<button
							type="button"
							class="rounded-evosnake border-evosnake-border bg-evosnake-surface2 text-evosnake-text hover:border-evosnake-primary border px-4 py-2.5 font-bold transition-colors"
							@click="handleCloseGameOver"
						>
							Main Menu
						</button>
					</div>
				</section>
			</div>
		</Teleport>
	</main>
</template>
