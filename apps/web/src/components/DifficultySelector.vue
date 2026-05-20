<script setup lang="ts">
	import { Zap, Target, Flame, Skull } from '@lucide/vue';
	import type { Difficulty } from '@packages/types';

	const modelValue = defineModel<Difficulty>({ required: true });

	const options: { value: Difficulty; label: string; icon: typeof Zap }[] = [
		{ value: 'easy', label: 'Easy', icon: Zap },
		{ value: 'normal', label: 'Normal', icon: Target },
		{ value: 'hard', label: 'Hard', icon: Flame },
		{ value: 'asian', label: 'Asian', icon: Skull }
	];
</script>

<template>
	<div class="flex flex-col gap-2">
		<label class="text-sm font-medium text-gray-300">Difficulty</label>
		<div class="grid grid-cols-2 gap-2">
			<button
				v-for="opt in options"
				:key="opt.value"
				type="button"
				@click="modelValue = opt.value"
				:class="[
					'flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-colors',
					modelValue === opt.value
						? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
						: 'border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-600 hover:text-gray-300'
				]"
			>
				<component
					:is="opt.icon"
					class="h-4 w-4"
				/>
				{{ opt.label }}
			</button>
		</div>
	</div>
</template>
