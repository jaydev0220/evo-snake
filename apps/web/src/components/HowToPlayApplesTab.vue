<script setup lang="ts">
	import { Apple } from '@lucide/vue';

	import { APPLE_COLORS, FRUIT_GUIDE } from '../lib/data';
	import HowToPlayPanelHeader from './HowToPlayPanelHeader.vue';
</script>

<template>
	<section>
		<HowToPlayPanelHeader
			title="Apples"
			:detail="`${FRUIT_GUIDE.length} types`"
		/>

		<div class="grid grid-cols-1 gap-2.5 md:grid-cols-2">
			<article
				v-for="fruit in FRUIT_GUIDE"
				:key="fruit.id"
				class="rounded-evosnake border-evosnake-border bg-evosnake-surface2 grid grid-cols-[42px_1fr] items-start gap-3 border p-3"
			>
				<div
					class="bg-evosnake-bg grid size-10.5 place-items-center rounded-xl text-xl"
					aria-hidden="true"
				>
					<Apple
						:color="APPLE_COLORS[fruit.id].outline"
						:fill="APPLE_COLORS[fruit.id].fill"
					/>
				</div>

				<div class="min-w-0">
					<div class="text-evosnake-text font-extrabold">{{ fruit.name }}</div>
					<p class="text-evosnake-muted mt-1 text-sm leading-6">{{ fruit.effect }}</p>
				</div>
			</article>
		</div>
	</section>
</template>
