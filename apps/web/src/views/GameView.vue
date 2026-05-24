<script setup lang="ts">
	import { AppleIcon, ArrowLeft as ArrowLeftIcon } from '@lucide/vue';
	import { computed, nextTick, onMounted, onUnmounted, ref, type CSSProperties, watch } from 'vue';

	import ActiveEffectsPanel from '../components/ActiveEffectsPanel.vue';
	import BonusChainPanel from '../components/BonusChainPanel.vue';
	import GameOverDialog from '../components/GameOverDialog.vue';
	import GameStatusPanel from '../components/GameStatusPanel.vue';
	import {
		APPLE_COLORS,
		BOARD_BG,
		BONUS_CHAIN_COMPLETION_BONUS,
		GRID_COLOR,
		SNAKE_COLORS,
		type AppleType,
		type Direction
	} from '../lib/data';
	import { directionToVector } from '../lib/game/geometry';
	import { useSnakeGame } from '../lib/game/useSnakeGame';
	import { useGameStore } from '../lib/stores/game';

	const emit = defineEmits<{
		back: [];
	}>();

	const store = useGameStore();

	const difficulty = computed(() => store.selectedDifficulty);
	const {
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
	} = useSnakeGame(difficulty);
	const canvasRef = ref<HTMLCanvasElement | null>(null);
	const applePositions = ref<
		Array<{ id: string; type: AppleType; x: number; y: number; size: number; isTarget: boolean }>
	>([]);

	const isUploading = ref(false);
	const uploadError = ref<string | null>(null);
	const swipeStart = ref<{ x: number; y: number; time: number } | null>(null);

	const SWIPE_THRESHOLD = 10;
	const SWIPE_MAX_AGE_MS = 500;
	const bonusChainTargetAppleIdSet = computed(() => new Set(bonusChainTargetAppleIds.value));
	const eventStyleVars = computed<CSSProperties | undefined>(() => {
		if (!activeEventTheme.value) {
			return undefined;
		}

		return {
			'--event-accent': activeEventTheme.value.accent,
			'--event-glow': activeEventTheme.value.glow,
			'--event-surface': activeEventTheme.value.surface,
			'--event-target-glow': activeEventTheme.value.targetGlow,
			'--event-target-outline': activeEventTheme.value.targetOutline
		} as CSSProperties;
	});

	function resizeCanvas() {
		const canvas = canvasRef.value;
		if (!canvas) return;
		const parent = canvas.parentElement;
		if (!parent) return;
		const rect = parent.getBoundingClientRect();
		canvas.width = rect.width;
		canvas.height = rect.height;
	}

	function handleResize() {
		resizeCanvas();
		drawGame();
	}

	function handleCanvasPointerDown(event: PointerEvent) {
		swipeStart.value = { x: event.clientX, y: event.clientY, time: Date.now() };
	}

	function handleCanvasPointerUp(event: PointerEvent) {
		const start = swipeStart.value;
		if (!start || !snakeBody.value.length) {
			swipeStart.value = null;
			return;
		}
		swipeStart.value = null;

		if (Date.now() - start.time > SWIPE_MAX_AGE_MS) return;

		const dx = event.clientX - start.x;
		const dy = event.clientY - start.y;
		const dist = Math.hypot(dx, dy);
		if (dist < SWIPE_THRESHOLD) return;

		const direction: Direction =
			Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
		setDirection(direction);
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
			size: Math.min(cellWidth, cellHeight),
			isTarget: bonusChainTargetAppleIdSet.value.has(apple.id)
		}));
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
		closeGameOver();
		emit('back');
	}

	function handlePlayAgain() {
		closeGameOver();
		isUploading.value = false;
		uploadError.value = null;
		resizeCanvas();
		initGame();
	}

	watch(renderVersion, async () => {
		await nextTick();
		drawGame();
	});

	watch(showGameOver, async (open) => {
		if (open) {
			await nextTick();
			await handleUploadScore();
		}
	});

	onMounted(() => {
		window.addEventListener('keydown', handleKeydown);
		window.addEventListener('resize', handleResize);
		resizeCanvas();
		initGame();
	});

	onUnmounted(() => {
		window.removeEventListener('keydown', handleKeydown);
		window.removeEventListener('resize', handleResize);
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
						:class="{ 'event-board-glow': !!activeEventTheme }"
						:style="eventStyleVars"
						aria-label="Game board container"
					>
						<div
							class="rounded-evosnake border-evosnake-border bg-evosnake-surface2 relative aspect-square w-full overflow-hidden border"
							:class="{ 'event-board-glow': !!activeEventTheme }"
							:style="eventStyleVars"
							aria-label="Square game area"
						>
							<div
								v-if="activeEventTheme"
								class="pointer-events-none absolute top-3 right-3 z-20 max-w-[calc(100%-1.5rem)] rounded-full border px-3 py-1.5 backdrop-blur-sm"
								:style="{
									...eventStyleVars,
									borderColor: activeEventTheme.accent,
									backgroundColor: activeEventTheme.surface,
									boxShadow: `0 0 24px ${activeEventTheme.glow}`
								}"
							>
								<div class="text-[10px] font-extrabold tracking-[0.18em] text-white/70 uppercase">
									Event Live
								</div>
								<div
									class="text-sm leading-none font-black"
									:style="{ color: activeEventTheme.accent }"
								>
									{{ activeEventTheme.label }}
								</div>
							</div>

							<canvas
								ref="canvasRef"
								class="block size-full touch-none"
								@pointerdown="handleCanvasPointerDown"
								@pointerup="handleCanvasPointerUp"
							/>

							<div
								v-for="applePosition in applePositions"
								:key="applePosition.id"
								class="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
								:style="{ left: `${applePosition.x}%`, top: `${applePosition.y}%` }"
							>
								<div
									class="relative grid place-items-center"
									:style="{ width: `${applePosition.size}px`, height: `${applePosition.size}px` }"
								>
									<div
										v-if="applePosition.isTarget && activeEventTheme"
										class="event-target-glow absolute inset-0 rounded-[32%]"
										:style="eventStyleVars"
									/>

									<AppleIcon
										class="relative z-10"
										:size="Math.max(Math.round(applePosition.size * 0.72), 14)"
										:color="APPLE_COLORS[applePosition.type].outline"
										:fill="APPLE_COLORS[applePosition.type].fill"
									/>
								</div>
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
						:theme="activeEventTheme"
					/>
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
