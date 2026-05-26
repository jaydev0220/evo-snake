<script setup lang="ts">
	import { Apple as AppleIcon } from '@lucide/vue';
	import { useI18n } from 'vue-i18n';

	defineProps<{
		effects: Array<{
			type: string;
			color: string;
			remaining: number;
		}>;
	}>();

	const { t } = useI18n({ useScope: 'global' });
</script>

<template>
	<section
		class="rounded-evosnakePanel border-evosnake-border bg-evosnake-surface shadow-evosnakeCard border p-3.5 md:p-4.5"
		:aria-label="t('game.activeEffects')"
	>
		<div class="text-evosnake-muted mb-2 text-xs font-extrabold tracking-wider uppercase">
			{{ t('game.activeEffects') }}
		</div>
		<div class="grid gap-1.5">
			<div
				v-for="effect in effects"
				:key="effect.type"
				class="rounded-evosnake border-evosnake-border bg-evosnake-surface2 flex items-center justify-between border px-3 py-1.5"
			>
				<div class="flex items-center gap-2">
					<AppleIcon
						:size="14"
						:color="effect.color"
						aria-hidden="true"
					/>
					<span class="text-evosnake-text text-sm font-bold">
						{{ t(`effects.${effect.type}`) }}
					</span>
				</div>
				<span class="text-evosnake-muted font-mono text-xs">{{ effect.remaining }}s</span>
			</div>
		</div>
	</section>
</template>
