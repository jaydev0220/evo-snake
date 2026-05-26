<script setup lang="ts">
	import { ArrowDown, ArrowLeft as ArrowLeftIcon, ArrowRight, ArrowUp } from '@lucide/vue';
	import { useI18n } from 'vue-i18n';

	import type { Direction } from '../lib/data';

	const emit = defineEmits<{
		move: [direction: Direction];
	}>();

	const { t } = useI18n({ useScope: 'global' });
</script>

<template>
	<section
		class="rounded-evosnakePanel border-evosnake-border bg-evosnake-surface shadow-evosnakeCard grid justify-center border p-3.5 md:p-4.5"
		:aria-label="t('game.onScreenControls')"
	>
		<div class="grid grid-cols-3 grid-rows-2 gap-2">
			<button
				class="arrow-key rounded-evosnake border-evosnake-border bg-evosnake-surface2 text-evosnake-text hover:border-evosnake-primary hover:bg-evosnake-surface3 active:bg-evosnake-primary col-start-2 row-start-1 grid size-13.5 touch-manipulation place-items-center border text-2xl font-black select-none active:text-[#08100b] md:size-14.5"
				type="button"
				:aria-label="t('game.moveUp')"
				@click="emit('move', 'up')"
			>
				<ArrowUp :size="20" />
			</button>
			<button
				class="arrow-key rounded-evosnake border-evosnake-border bg-evosnake-surface2 text-evosnake-text hover:border-evosnake-primary hover:bg-evosnake-surface3 active:bg-evosnake-primary col-start-1 row-start-2 grid size-13.5 touch-manipulation place-items-center border text-2xl font-black select-none active:text-[#08100b] md:size-14.5"
				type="button"
				:aria-label="t('game.moveLeft')"
				@click="emit('move', 'left')"
			>
				<ArrowLeftIcon :size="20" />
			</button>
			<button
				class="arrow-key rounded-evosnake border-evosnake-border bg-evosnake-surface2 text-evosnake-text hover:border-evosnake-primary hover:bg-evosnake-surface3 active:bg-evosnake-primary col-start-2 row-start-2 grid size-13.5 touch-manipulation place-items-center border text-2xl font-black select-none active:text-[#08100b] md:size-14.5"
				type="button"
				:aria-label="t('game.moveDown')"
				@click="emit('move', 'down')"
			>
				<ArrowDown :size="20" />
			</button>
			<button
				class="arrow-key rounded-evosnake border-evosnake-border bg-evosnake-surface2 text-evosnake-text hover:border-evosnake-primary hover:bg-evosnake-surface3 active:bg-evosnake-primary col-start-3 row-start-2 grid size-13.5 touch-manipulation place-items-center border text-2xl font-black select-none active:text-[#08100b] md:size-14.5"
				type="button"
				:aria-label="t('game.moveRight')"
				@click="emit('move', 'right')"
			>
				<ArrowRight :size="20" />
			</button>
		</div>
	</section>
</template>
