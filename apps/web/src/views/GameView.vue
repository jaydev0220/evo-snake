<script setup lang="ts">
	import { ArrowLeft } from '@lucide/vue';
	import { ref, onMounted, onUnmounted } from 'vue';

	const emit = defineEmits<{
		back: [];
	}>();

	interface Direction {
		x: number;
		y: number;
	}

	const direction = ref<Direction>({ x: 1, y: 0 });
	const snake = ref<{ x: number; y: number }[]>([{ x: 5, y: 5 }]);
	const food = ref<{ x: number; y: number }>({ x: 10, y: 10 });
	const score = ref(0);
	const multiplier = ref(1.0);
	const mode = ref('Normal');
	const gridSize = 20;
	const gameLoop = ref<number | null>(null);

	const canvasRef = ref<HTMLCanvasElement | null>(null);

	function setDirection(newDir: Direction) {
		if (newDir.x !== -direction.value.x || newDir.y !== -direction.value.y) {
			direction.value = newDir;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		switch (e.key) {
			case 'w':
			case 'W':
			case 'ArrowUp':
				e.preventDefault();
				setDirection({ x: 0, y: -1 });
				break;
			case 'a':
			case 'A':
			case 'ArrowLeft':
				e.preventDefault();
				setDirection({ x: -1, y: 0 });
				break;
			case 's':
			case 'S':
			case 'ArrowDown':
				e.preventDefault();
				setDirection({ x: 0, y: 1 });
				break;
			case 'd':
			case 'D':
			case 'ArrowRight':
				e.preventDefault();
				setDirection({ x: 1, y: 0 });
				break;
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

		const cellWidth = canvas.width / gridSize;
		const cellHeight = canvas.height / gridSize;

		ctx.fillStyle = '#1f2a23';
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		ctx.strokeStyle = 'rgba(242, 247, 243, 0.045)';
		ctx.lineWidth = 1;
		for (let i = 0; i <= gridSize; i++) {
			ctx.beginPath();
			ctx.moveTo(i * cellWidth, 0);
			ctx.lineTo(i * cellWidth, canvas.height);
			ctx.stroke();
			ctx.beginPath();
			ctx.moveTo(0, i * cellHeight);
			ctx.lineTo(canvas.width, i * cellHeight);
			ctx.stroke();
		}

		ctx.fillStyle = '#54d978';
		for (const segment of snake.value) {
			ctx.fillRect(
				segment.x * cellWidth + 2,
				segment.y * cellHeight + 2,
				cellWidth - 4,
				cellHeight - 4
			);
		}

		ctx.fillStyle = '#e05f5f';
		ctx.beginPath();
		ctx.arc(
			food.value.x * cellWidth + cellWidth / 2,
			food.value.y * cellHeight + cellHeight / 2,
			cellWidth / 2 - 2,
			0,
			Math.PI * 2
		);
		ctx.fill();
	}

function updateGame() {
	const head = snake.value[0];
	if (!head) return;
	const newHead = {
		x: (head.x + direction.value.x + gridSize) % gridSize,
		y: (head.y + direction.value.y + gridSize) % gridSize,
	};

	const tail = snake.value[snake.value.length - 1];
	if (tail) {
		snake.value = [newHead, ...snake.value.slice(0, -1)];
	}

	if (newHead.x === food.value.x && newHead.y === food.value.y) {
		score.value += 10 * multiplier.value;
		if (tail) {
			snake.value.push({ ...tail });
		}
		food.value = {
			x: Math.floor(Math.random() * gridSize),
			y: Math.floor(Math.random() * gridSize),
		};
	}

	drawGame();
}

onMounted(() => {
		window.addEventListener('keydown', handleKeydown);
		resizeCanvas();
		window.addEventListener('resize', resizeCanvas);
		gameLoop.value = window.setInterval(updateGame, 150);
	});

	onUnmounted(() => {
		window.removeEventListener('keydown', handleKeydown);
		window.removeEventListener('resize', resizeCanvas);
		if (gameLoop.value) {
			clearInterval(gameLoop.value);
		}
	});
</script>

<template>
	<main
		class="bg-evosnake-bg text-evosnake-text grid min-h-screen place-items-start px-4 py-5 md:place-items-center md:px-6"
	>
		<section
			class="grid w-full max-w-[980px] gap-4"
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
							class="rounded-evosnake border-evosnake-border bg-evosnake-surface shadow-evosnakeCard grid min-h-[64px] content-center gap-1 border px-3.5 py-3"
						>
							<div class="text-evosnake-muted text-xs font-extrabold tracking-wider uppercase">
								Score
							</div>
							<div class="text-evosnake-text truncate text-lg font-black tracking-[-0.03em]">
								{{ score.toLocaleString() }}
							</div>
						</div>

						<div
							class="rounded-evosnake border-evosnake-border bg-evosnake-surface shadow-evosnakeCard grid min-h-[64px] content-center gap-1 border px-3.5 py-3"
						>
							<div class="text-evosnake-muted text-xs font-extrabold tracking-wider uppercase">
								Multiplier
							</div>
							<div class="text-evosnake-text truncate text-lg font-black tracking-[-0.03em]">
								x{{ multiplier.toFixed(1) }}
							</div>
						</div>

						<div
							class="rounded-evosnake border-evosnake-border bg-evosnake-surface shadow-evosnakeCard grid min-h-[64px] content-center gap-1 border px-3.5 py-3"
						>
							<div class="text-evosnake-muted text-xs font-extrabold tracking-wider uppercase">
								Mode
							</div>
							<div class="text-evosnake-text truncate text-lg font-black tracking-[-0.03em]">
								{{ mode }}
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
							class="arrow-key rounded-evosnake border-evosnake-border bg-evosnake-surface2 text-evosnake-text hover:border-evosnake-primary hover:bg-evosnake-surface3 active:bg-evosnake-primary col-start-2 row-start-1 grid size-[54px] touch-manipulation place-items-center border text-2xl font-black select-none active:text-[#08100b] md:size-[58px]"
							type="button"
							aria-label="Move up"
							@click="setDirection({ x: 0, y: -1 })"
						>
							↑
						</button>
						<button
							class="arrow-key rounded-evosnake border-evosnake-border bg-evosnake-surface2 text-evosnake-text hover:border-evosnake-primary hover:bg-evosnake-surface3 active:bg-evosnake-primary col-start-1 row-start-2 grid size-[54px] touch-manipulation place-items-center border text-2xl font-black select-none active:text-[#08100b] md:size-[58px]"
							type="button"
							aria-label="Move left"
							@click="setDirection({ x: -1, y: 0 })"
						>
							←
						</button>
						<button
							class="arrow-key rounded-evosnake border-evosnake-border bg-evosnake-surface2 text-evosnake-text hover:border-evosnake-primary hover:bg-evosnake-surface3 active:bg-evosnake-primary col-start-2 row-start-2 grid size-[54px] touch-manipulation place-items-center border text-2xl font-black select-none active:text-[#08100b] md:size-[58px]"
							type="button"
							aria-label="Move down"
							@click="setDirection({ x: 0, y: 1 })"
						>
							↓
						</button>
						<button
							class="arrow-key rounded-evosnake border-evosnake-border bg-evosnake-surface2 text-evosnake-text hover:border-evosnake-primary hover:bg-evosnake-surface3 active:bg-evosnake-primary col-start-3 row-start-2 grid size-[54px] touch-manipulation place-items-center border text-2xl font-black select-none active:text-[#08100b] md:size-[58px]"
							type="button"
							aria-label="Move right"
							@click="setDirection({ x: 1, y: 0 })"
						>
							→
						</button>
					</div>
				</section>
			</section>
		</section>
	</main>
</template>
