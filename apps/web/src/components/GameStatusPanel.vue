<script setup lang="ts">
	defineProps<{
		score: number;
		multiplier: number;
		modeLabel: string;
	}>();
</script>

<template>
	<section
		class="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-2.5"
		aria-label="Game status"
	>
		<div
			class="rounded-evosnake border-evosnake-border bg-evosnake-surface shadow-evosnakeCard grid min-h-16 content-center gap-1 border px-3.5 py-3"
		>
			<div class="text-evosnake-muted text-xs font-extrabold tracking-wider uppercase">Score</div>
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
				x{{ multiplier.toFixed(2) }}
			</div>
		</div>

		<div
			class="rounded-evosnake border-evosnake-border bg-evosnake-surface shadow-evosnakeCard grid min-h-16 content-center gap-1 border px-3.5 py-3"
		>
			<div class="text-evosnake-muted text-xs font-extrabold tracking-wider uppercase">Mode</div>
			<div class="text-evosnake-text truncate text-lg font-black tracking-[-0.03em]">
				{{ modeLabel }}
			</div>
		</div>
	</section>
</template>
