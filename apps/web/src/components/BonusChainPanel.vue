<script setup lang="ts">
	import { Apple as AppleIcon } from '@lucide/vue';

	import { APPLE_COLORS } from '../lib/data';
	import type { SpawnableAppleType } from '../lib/data';

	defineProps<{
		bonusAmount: number;
		steps: Array<{
			type: SpawnableAppleType;
			index: number;
			isCompleted: boolean;
			isCurrent: boolean;
		}>;
	}>();
</script>

<template>
	<section
		class="rounded-evosnakePanel border-evosnake-border bg-evosnake-surface shadow-evosnakeCard grid gap-3 border p-3.5 md:p-4.5"
		aria-label="Bonus chain"
	>
		<div class="flex items-start justify-between gap-3">
			<div>
				<div class="text-evosnake-muted text-xs font-extrabold tracking-wider uppercase">
					Bonus Chain
				</div>
				<p class="text-evosnake-muted mt-1 text-sm leading-5">
					Eat apples in this order. One wrong bite cancels the event.
				</p>
			</div>
			<div class="text-evosnake-primary text-right text-sm font-black">+{{ bonusAmount }}</div>
		</div>

		<div class="grid grid-cols-2 gap-2">
			<div
				v-for="step in steps"
				:key="`${step.index}-${step.type}`"
				class="rounded-evosnake border px-2 py-3 text-center transition-colors"
				:class="
					step.isCurrent
						? 'border-evosnake-primary bg-evosnake-primary/10'
						: step.isCompleted
							? 'border-evosnake-border bg-evosnake-surface2 opacity-45'
							: 'border-evosnake-border bg-evosnake-surface2'
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
						{{ step.type }}
					</div>
				</div>
			</div>
		</div>
	</section>
</template>
