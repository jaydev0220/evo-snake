<script setup lang="ts">
	import type { Difficulty } from '@packages/types';
	import { computed, ref } from 'vue';
	import { useI18n } from 'vue-i18n';

	import { isAsianDifficulty, isEasierThanAsian } from '../lib/asian-mode';
	import AsianDifficultyDowngradeDialog from './AsianDifficultyDowngradeDialog.vue';

	const modelValue = defineModel<Difficulty>({ required: true });

	const { t } = useI18n({ useScope: 'global' });
	const pendingDifficulty = ref<Difficulty | null>(null);
	const showDowngradeDialog = ref(false);

	const options = computed(
		(): Array<{ value: Difficulty; label: string }> => [
			{ value: 'easy', label: t('difficulty.easy') },
			{ value: 'normal', label: t('difficulty.normal') },
			{ value: 'hard', label: t('difficulty.hard') },
			{ value: 'asian', label: t('difficulty.asian') }
		]
	);

	function selectDifficulty(difficulty: Difficulty) {
		if (difficulty === modelValue.value) return;

		if (isAsianDifficulty(modelValue.value) && isEasierThanAsian(difficulty)) {
			pendingDifficulty.value = difficulty;
			showDowngradeDialog.value = true;
			return;
		}

		modelValue.value = difficulty;
	}

	function closeDowngradeDialog() {
		showDowngradeDialog.value = false;
		if (pendingDifficulty.value) {
			modelValue.value = pendingDifficulty.value;
			pendingDifficulty.value = null;
		}
	}
</script>

<template>
	<div
		class="grid grid-cols-2 gap-2.5 md:grid-cols-4"
		role="radiogroup"
		:aria-label="t('difficulty.label')"
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
				:checked="modelValue === opt.value"
				class="peer sr-only"
				@change="selectDifficulty(opt.value)"
			/>
			<span
				class="rounded-evosnake border-evosnake-border bg-evosnake-surface2 text-evosnake-text peer-checked:bg-evosnake-primary peer-checked:border-evosnake-primary hover:border-evosnake-primary grid min-h-12 cursor-pointer place-items-center border font-bold select-none peer-checked:text-[#08100b]"
			>
				{{ opt.label }}
			</span>
		</label>
	</div>

	<AsianDifficultyDowngradeDialog
		:open="showDowngradeDialog"
		:target-difficulty="pendingDifficulty"
		@close="closeDowngradeDialog"
	/>
</template>
