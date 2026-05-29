<script setup lang="ts">
	import type { Difficulty, MapId } from '@packages/types';
	import { useI18n } from 'vue-i18n';

	defineProps<{
		score: number;
		multiplier: number;
		mode: Difficulty;
		map: MapId;
	}>();

	const { n, t } = useI18n({ useScope: 'global' });
</script>

<template>
	<section
		class="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-2.5 lg:grid-cols-4"
		:aria-label="t('game.status')"
	>
		<div
			class="rounded-evosnake border-evosnake-border bg-evosnake-surface shadow-evosnakeCard grid min-h-16 content-center gap-1 border px-3.5 py-3"
		>
			<div class="text-evosnake-muted text-xs font-extrabold tracking-wider uppercase">
				{{ t('game.score') }}
			</div>
			<div class="text-evosnake-text truncate text-lg font-black tracking-[-0.03em]">
				{{ n(score, 'decimal') }}
			</div>
		</div>

		<div
			class="rounded-evosnake border-evosnake-border bg-evosnake-surface shadow-evosnakeCard grid min-h-16 content-center gap-1 border px-3.5 py-3"
		>
			<div class="text-evosnake-muted text-xs font-extrabold tracking-wider uppercase">
				{{ t('game.multiplier') }}
			</div>
			<div class="text-evosnake-text truncate text-lg font-black tracking-[-0.03em]">
				x{{ n(multiplier, 'multiplier') }}
			</div>
		</div>

		<div
			class="rounded-evosnake border-evosnake-border bg-evosnake-surface shadow-evosnakeCard grid min-h-16 content-center gap-1 border px-3.5 py-3"
		>
			<div class="text-evosnake-muted text-xs font-extrabold tracking-wider uppercase">
				{{ t('game.mode') }}
			</div>
			<div class="text-evosnake-text truncate text-lg font-black tracking-[-0.03em]">
				{{ t(`difficulty.${mode}`) }}
			</div>
		</div>

		<div
			class="rounded-evosnake border-evosnake-border bg-evosnake-surface shadow-evosnakeCard grid min-h-16 content-center gap-1 border px-3.5 py-3"
		>
			<div class="text-evosnake-muted text-xs font-extrabold tracking-wider uppercase">
				{{ t('game.map') }}
			</div>
			<div class="text-evosnake-text truncate text-lg font-black tracking-[-0.03em]">
				{{ t(`maps.${map}.name`) }}
			</div>
		</div>
	</section>
</template>
