<script setup lang="ts">
	import { Apple as AppleIcon } from '@lucide/vue';
	import { useI18n } from 'vue-i18n';

	import { APPLE_COLORS } from '../lib/data';
	import type { GameEventTheme, SpawnableAppleType } from '../lib/data';

	defineProps<{
		bonusAmount: number;
		theme?: GameEventTheme | null;
		steps: Array<{
			type: SpawnableAppleType;
			index: number;
			isCompleted: boolean;
			isCurrent: boolean;
		}>;
	}>();

	const { n, t } = useI18n({ useScope: 'global' });
</script>

<template>
	<section
		class="rounded-evosnakePanel border-evosnake-border bg-evosnake-surface shadow-evosnakeCard grid gap-3 border p-3.5 md:p-4.5"
		:aria-label="t('events.bonusChain.name')"
		:style="
			theme
				? {
						borderColor: theme.accent,
						boxShadow: `0 0 28px ${theme.glow}`
					}
				: undefined
		"
	>
		<div class="flex items-start justify-between gap-3">
			<div class="text-evosnake-muted text-xs font-extrabold tracking-wider uppercase">
				{{ t('events.bonusChain.name') }}
			</div>
			<div
				class="text-right text-sm font-black"
				:style="{ color: theme?.accent ?? undefined }"
			>
				+{{ n(bonusAmount, 'decimal') }}
			</div>
		</div>

		<div class="grid grid-cols-2 gap-2">
			<div
				v-for="step in steps"
				:key="`${step.index}-${step.type}`"
				class="rounded-evosnake border px-2 py-3 text-center transition-colors"
				:class="
					step.isCurrent
						? ''
						: step.isCompleted
							? 'border-evosnake-border bg-evosnake-surface2 opacity-45'
							: 'border-evosnake-border bg-evosnake-surface2'
				"
				:style="
					step.isCurrent && theme
						? {
								borderColor: theme.accent,
								backgroundColor: theme.surface,
								boxShadow: `0 0 18px ${theme.targetGlow}`
							}
						: undefined
				"
			>
				<div class="text-evosnake-muted mb-2 text-[10px] font-black tracking-[0.2em] uppercase">
					{{ step.index + 1 }}
				</div>
				<div class="grid justify-items-center gap-1.5">
					<AppleIcon
						:size="20"
						:color="APPLE_COLORS[step.type].outline"
						:fill="APPLE_COLORS[step.type].fill"
					/>
					<div class="text-evosnake-text text-center text-[11px] font-bold capitalize">
						{{ t(`apples.types.${step.type}.name`) }}
					</div>
				</div>
			</div>
		</div>
	</section>
</template>
