<script setup lang="ts">
	import type { Difficulty } from '@packages/types';

	const modelValue = defineModel<Difficulty>({ required: true });

	const options: { value: Difficulty; label: string }[] = [
		{ value: 'easy', label: 'Easy' },
		{ value: 'normal', label: 'Normal' },
		{ value: 'hard', label: 'Hard' },
		{ value: 'asian', label: 'Asian' }
	];
</script>

<template>
	<div
		class="grid grid-cols-2 gap-2.5 md:grid-cols-4"
		role="radiogroup"
		aria-label="Difficulty selector"
	>
		<label
			v-for="opt in options"
			:key="opt.value"
			class="relative"
		>
			<input
				type="radio"
				name="difficulty"
				:value="opt.value"
				v-model="modelValue"
				class="peer sr-only"
			/>
			<span
				class="rounded-evosnake border-evosnake-border bg-evosnake-surface2 text-evosnake-text peer-checked:bg-evosnake-primary peer-checked:border-evosnake-primary hover:border-evosnake-primary grid min-h-12 cursor-pointer place-items-center border font-bold select-none peer-checked:text-[#08100b]"
			>
				{{ opt.label }}
			</span>
		</label>
	</div>
</template>
