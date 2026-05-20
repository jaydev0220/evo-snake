<script setup lang="ts">
	import { ArrowLeft } from '@lucide/vue';
	import { ref, onMounted, onUnmounted, computed } from 'vue';

	const emit = defineEmits<{
		back: [];
	}>();

	type Direction = 'up' | 'down' | 'left' | 'right';
	type AppleType = 'classic' | 'shrink' | 'turbo' | 'chill' | 'ghost' | 'golden';
	type GameStatus = 'idle' | 'playing' | 'paused' | 'gameOver';

	interface Position {
		x: number;
		y: number;
	}

	interface ActiveEffect {
		type: 'turbo' | 'chill' | 'ghost';
		startedAt: number;
		durationMs: number;
		expiresAt: number;
	}

	interface Apple {
		type: AppleType;
		position: Position;
		spawnedAt: number;
		expiresAt: number | null;
	}

	interface DifficultyConfig {
		label: string;
		mapWidth: number;
		mapHeight: number;
		tickMs: number;
		specialAppleLifetimeMs: number;
	}

	const DIFFICULTIES: Record<string, DifficultyConfig> = {
		easy: { label: 'Easy', mapWidth: 24, mapHeight: 24, tickMs: 160, specialAppleLifetimeMs: 9000 },
		normal: {
			label: 'Normal',
			mapWidth: 20,
			mapHeight: 20,
			tickMs: 120,
			specialAppleLifetimeMs: 7500
		},
		hard: { label: 'Hard', mapWidth: 16, mapHeight: 16, tickMs: 90, specialAppleLifetimeMs: 6000 },
		asian: { label: 'Asian', mapWidth: 14, mapHeight: 14, tickMs: 70, specialAppleLifetimeMs: 4500 }
	};

	const APPLE_COLORS: Record<AppleType, { fill: string; outline: string }> = {
		classic: { fill: '#E53935', outline: '#9F1D1D' },
		shrink: { fill: '#8E44AD', outline: '#4C1D95' },
		turbo: { fill: '#F97316', outline: '#9A3412' },
		chill: { fill: '#38BDF8', outline: '#0369A1' },
		ghost: { fill: '#E0F2FE', outline: '#7DD3FC' },
		golden: { fill: '#FACC15', outline: '#B45309' }
	};

	const APPLE_SPAWN_WEIGHTS: Record<AppleType, number> = {
		classic: 60,
		shrink: 10,
		turbo: 10,
		chill: 8,
		ghost: 5,
		golden: 7
	};

	const BASE_POINTS = 20;
	const MIN_SNAKE_LENGTH = 3;
	const STARTING_SNAKE_LENGTH = 3;
	const MIN_POINTS_MULTIPLIER = 0.25;
	const MAX_POINTS_MULTIPLIER = 3.0;

	const difficulty = ref<keyof typeof DIFFICULTIES>('normal');
	const status = ref<GameStatus>('playing');
	const snakeBody = ref<Position[]>([]);
	const snakeDirection = ref<Direction>('right');
	const queuedDirection = ref<Direction>('right');
	const targetLength = ref(STARTING_SNAKE_LENGTH);
	const score = ref(0);
	const pointsMultiplier = ref(1.0);
	const activeEffects = ref<ActiveEffect[]>([]);
	const apple = ref<Apple | null>(null);
	const gameLoop = ref<number | null>(null);
	const appleTimer = ref<number | null>(null);
	const canvasRef = ref<HTMLCanvasElement | null>(null);

	const currentConfig = computed(() => DIFFICULTIES[difficulty.value]);
const mapWidth = computed(() => currentConfig.value!.mapWidth);
const mapHeight = computed(() => currentConfig.value!.mapHeight);
const currentTickMs = computed(() => {
	const turbo = activeEffects.value.find((e) => e.type === 'turbo');
	const chill = activeEffects.value.find((e) => e.type === 'chill');
	const config = currentConfig.value!;
	if (turbo) return config.tickMs / 1.35;
	if (chill) return config.tickMs / 0.7;
	return config.tickMs;
});

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

	function clamp(val: number, min: number, max: number) {
		return Math.min(Math.max(val, min), max);
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

	function getRandomEmptyCell(): Position {
		const occupied = new Set(snakeBody.value.map((p) => `${p.x},${p.y}`));
		if (apple.value) occupied.add(`${apple.value.position.x},${apple.value.position.y}`);

		const emptyCells: Position[] = [];
		for (let x = 0; x < mapWidth.value; x++) {
			for (let y = 0; y < mapHeight.value; y++) {
				if (!occupied.has(`${x},${y}`)) {
					emptyCells.push({ x, y });
				}
			}
		}

	if (emptyCells.length === 0) return { x: 0, y: 0 };
	return emptyCells[Math.floor(Math.random() * emptyCells.length)]!;
	}

	function spawnApple(): Apple {
		const weights = APPLE_SPAWN_WEIGHTS;
		const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
		let random = Math.random() * totalWeight;

		let type: AppleType = 'classic';
		for (const [key, weight] of Object.entries(weights)) {
			random -= weight;
			if (random <= 0) {
				type = key as AppleType;
				break;
			}
		}

		const isSpecial = type !== 'classic';
		const now = Date.now();

		return {
			type,
			position: getRandomEmptyCell(),
			spawnedAt: now,
			expiresAt: isSpecial ? now + currentConfig.value!.specialAppleLifetimeMs : null,
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

		switch (eatenApple.type) {
			case 'classic':
				score.value += Math.round(BASE_POINTS * mult);
				targetLength.value += 1;
				break;
			case 'shrink':
				targetLength.value = Math.max(MIN_SNAKE_LENGTH, targetLength.value - 3);
				while (snakeBody.value.length > targetLength.value) {
					snakeBody.value.pop();
				}
				break;
			case 'turbo':
				score.value += Math.round(BASE_POINTS * mult);
				targetLength.value += 1;
				replaceSpeedEffect('turbo', 5000, 0.5);
				break;
			case 'chill':
				score.value += Math.round(BASE_POINTS * mult);
				targetLength.value += 1;
				replaceSpeedEffect('chill', 5000, -0.25);
				break;
			case 'ghost':
				score.value += Math.round(BASE_POINTS * mult);
				targetLength.value += 1;
				refreshGhostEffect(4500);
				break;
			case 'golden':
				score.value += Math.round(BASE_POINTS * mult * 3);
				break;
		}

		apple.value = spawnApple();
		startAppleTimer();
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

	function checkAppleExpiration() {
		if (!apple.value || !apple.value.expiresAt) return;
		if (Date.now() >= apple.value.expiresAt) {
			apple.value = spawnApple();
			startAppleTimer();
		}
	}

	function startAppleTimer() {
		if (appleTimer.value) clearTimeout(appleTimer.value);
		if (apple.value?.expiresAt) {
			const delay = apple.value.expiresAt - Date.now();
			if (delay > 0) {
				appleTimer.value = window.setTimeout(() => {
					checkAppleExpiration();
				}, delay);
			}
		}
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

		ctx.fillStyle = '#1f2a23';
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		ctx.strokeStyle = 'rgba(242, 247, 243, 0.045)';
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
			? 'rgba(84, 217, 120, 0.4)'
			: isTurboActive.value
				? '#FFB347'
				: isChillActive.value
					? '#87CEEB'
					: '#54d978';

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

		if (apple.value) {
			const colors = APPLE_COLORS[apple.value.type];
			const ax = apple.value.position.x * cellWidth + cellWidth / 2;
			const ay = apple.value.position.y * cellHeight + cellHeight / 2;
			const radius = cellWidth / 2 - 2;

			ctx.fillStyle = colors.fill;
			ctx.strokeStyle = colors.outline;
			ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.arc(ax, ay, radius, 0, Math.PI * 2);
			ctx.fill();
			ctx.stroke();

			if (apple.value.type === 'golden') {
				ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
				ctx.beginPath();
				ctx.arc(ax - radius * 0.3, ay - radius * 0.3, radius * 0.25, 0, Math.PI * 2);
				ctx.fill();
			}
		}
	}

	function updateGame() {
		checkExpiredEffects();
		checkAppleExpiration();

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
			status.value = 'gameOver';
			stopGame();
			emit('back');
			return;
		}

		if (!isGhostActive.value) {
			for (const segment of snakeBody.value) {
				if (segment.x === newHead.x && segment.y === newHead.y) {
					status.value = 'gameOver';
					stopGame();
					emit('back');
					return;
				}
			}
		}

		snakeBody.value.unshift(newHead);
		while (snakeBody.value.length > targetLength.value) {
			snakeBody.value.pop();
		}

		if (
			apple.value &&
			newHead.x === apple.value.position.x &&
			newHead.y === apple.value.position.y
		) {
			applyAppleEffect(apple.value);
		}

		drawGame();
	}

	function stopGame() {
		if (gameLoop.value) {
			clearInterval(gameLoop.value);
			gameLoop.value = null;
		}
		if (appleTimer.value) {
			clearTimeout(appleTimer.value);
			appleTimer.value = null;
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
		apple.value = spawnApple();
		status.value = 'playing';

		resizeCanvas();
		drawGame();
		startAppleTimer();

		gameLoop.value = window.setInterval(updateGame, currentTickMs.value);
	}

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
					<ArrowLeft
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
								{{ currentConfig!.label }}
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
						</div>
					</section>
				</div>

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
							↑
						</button>
						<button
							class="arrow-key rounded-evosnake border-evosnake-border bg-evosnake-surface2 text-evosnake-text hover:border-evosnake-primary hover:bg-evosnake-surface3 active:bg-evosnake-primary col-start-1 row-start-2 grid size-13.5 touch-manipulation place-items-center border text-2xl font-black select-none active:text-[#08100b] md:size-14.5"
							type="button"
							aria-label="Move left"
							@click="setDirection('left')"
						>
							←
						</button>
						<button
							class="arrow-key rounded-evosnake border-evosnake-border bg-evosnake-surface2 text-evosnake-text hover:border-evosnake-primary hover:bg-evosnake-surface3 active:bg-evosnake-primary col-start-2 row-start-2 grid size-13.5 touch-manipulation place-items-center border text-2xl font-black select-none active:text-[#08100b] md:size-14.5"
							type="button"
							aria-label="Move down"
							@click="setDirection('down')"
						>
							↓
						</button>
						<button
							class="arrow-key rounded-evosnake border-evosnake-border bg-evosnake-surface2 text-evosnake-text hover:border-evosnake-primary hover:bg-evosnake-surface3 active:bg-evosnake-primary col-start-3 row-start-2 grid size-13.5 touch-manipulation place-items-center border text-2xl font-black select-none active:text-[#08100b] md:size-14.5"
							type="button"
							aria-label="Move right"
							@click="setDirection('right')"
						>
							→
						</button>
					</div>
				</section>
			</section>
		</section>
	</main>
</template>
