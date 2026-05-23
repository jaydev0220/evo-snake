<script setup lang="ts">
	import { Apple as AppleIcon } from '@lucide/vue';

	defineProps<{
		effects: Array<{
			type: string;
			label: string;
			color: string;
			remaining: number;
		}>;
	}>();
</script>

<template>
	<section
		class="rounded-evosnakePanel border-evosnake-border bg-evosnake-surface shadow-evosnakeCard border p-3.5 md:p-4.5"
		aria-label="Active effects"
	>
		<div class="text-evosnake-muted mb-2 text-xs font-extrabold tracking-wider uppercase">
			Active Effects
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
					<span class="text-evosnake-text text-sm font-bold">{{ effect.label }}</span>
				</div>
				<span class="text-evosnake-muted font-mono text-xs">{{ effect.remaining }}s</span>
			</div>
		</div>
	</section>
</template>
