<script setup lang="ts">
	import { X } from '@lucide/vue';
	import type { Difficulty } from '@packages/types';
	import { nextTick, ref, watch } from 'vue';
	import { useI18n } from 'vue-i18n';

	import { ASIAN_DOWNGRADE_LINE_COUNT, getRandomMessageIndex } from '../lib/asian-mode';

	const props = defineProps<{
		open: boolean;
		targetDifficulty: Difficulty | null;
	}>();

	const emit = defineEmits<{
		close: [];
	}>();

	const { t } = useI18n({ useScope: 'global' });
	const closeButtonRef = ref<HTMLButtonElement | null>(null);
	const lineIndex = ref(0);

	watch(
		() => props.open,
		async (open) => {
			if (!open) return;
			lineIndex.value = getRandomMessageIndex(ASIAN_DOWNGRADE_LINE_COUNT);
			await nextTick();
			closeButtonRef.value?.focus();
		}
	);
</script>

<template>
	<Teleport to="body">
		<div
			v-if="open"
			class="fixed inset-0 z-60 grid place-items-center bg-black/70 px-4 py-5"
		>
			<section
				role="dialog"
				aria-modal="true"
				aria-labelledby="asian-downgrade-title"
				class="rounded-evosnakePanel border-evosnake-danger bg-evosnake-surface shadow-evosnakePanel relative w-full max-w-md border p-6 pt-12"
			>
				<button
					ref="closeButtonRef"
					type="button"
					:aria-label="t('asianMode.downgrade.close')"
					class="text-evosnake-muted hover:text-evosnake-text absolute top-3 right-3 rounded-lg p-1.5 transition-colors"
					@click="emit('close')"
				>
					<X
						class="h-5 w-5"
						aria-hidden="true"
					/>
				</button>

				<p class="text-evosnake-text mt-3 text-xl leading-tight font-black">
					{{ t(`asianMode.downgrade.lines.${lineIndex}`) }}
				</p>
			</section>
		</div>
	</Teleport>
</template>
