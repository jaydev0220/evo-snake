<script setup lang="ts">
	import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp } from '@lucide/vue';

	import { CONTROL_GUIDE_CARDS } from '../lib/how-to-play';
	import HowToPlayPanelHeader from './HowToPlayPanelHeader.vue';
</script>

<template>
	<section>
		<HowToPlayPanelHeader
			title="Controls"
			:detail="`${CONTROL_GUIDE_CARDS.length} methods`"
		/>

		<div class="grid grid-cols-1 gap-2.5 md:grid-cols-3">
			<article
				v-for="control in CONTROL_GUIDE_CARDS"
				:key="control.id"
				class="rounded-evosnake border-evosnake-border bg-evosnake-surface2 grid min-h-40 place-items-center gap-3 border p-4 text-center"
			>
				<div class="text-evosnake-text font-extrabold tracking-tight">{{ control.label }}</div>

				<div
					v-if="control.type === 'keys'"
					class="grid justify-center gap-1.5"
					:aria-label="control.ariaLabel"
				>
					<div class="flex justify-center gap-1.5">
						<kbd
							class="border-evosnake-border bg-evosnake-bg text-evosnake-text grid size-10 place-items-center rounded-lg border text-sm font-black shadow-inner select-none"
						>
							<template v-if="control.id === 'arrows'">
								<ArrowUp
									:size="18"
									aria-hidden="true"
								/>
							</template>
							<template v-else>W</template>
						</kbd>
					</div>

					<div class="flex justify-center gap-1.5">
						<template v-if="control.id === 'arrows'">
							<kbd
								class="border-evosnake-border bg-evosnake-bg text-evosnake-text grid size-10 place-items-center rounded-lg border text-sm font-black shadow-inner select-none"
							>
								<ArrowLeft
									:size="18"
									aria-hidden="true"
								/>
							</kbd>
							<kbd
								class="border-evosnake-border bg-evosnake-bg text-evosnake-text grid size-10 place-items-center rounded-lg border text-sm font-black shadow-inner select-none"
							>
								<ArrowDown
									:size="18"
									aria-hidden="true"
								/>
							</kbd>
							<kbd
								class="border-evosnake-border bg-evosnake-bg text-evosnake-text grid size-10 place-items-center rounded-lg border text-sm font-black shadow-inner select-none"
							>
								<ArrowRight
									:size="18"
									aria-hidden="true"
								/>
							</kbd>
						</template>
						<template v-else>
							<kbd
								v-for="key in ['A', 'S', 'D']"
								:key="key"
								class="border-evosnake-border bg-evosnake-bg text-evosnake-text grid size-10 place-items-center rounded-lg border text-sm font-black shadow-inner select-none"
							>
								{{ key }}
							</kbd>
						</template>
					</div>
				</div>

				<div
					v-else
					class="border-evosnake-border bg-evosnake-bg text-evosnake-muted grid min-h-20 w-full place-items-center rounded-xl border px-4 text-xs font-extrabold tracking-[0.2em] uppercase"
				>
					<div class="flex items-center gap-2">
						<span class="bg-evosnake-primary size-2 animate-pulse rounded-full opacity-70" />
						<span>Swipe</span>
						<span
							class="bg-evosnake-primary size-2 animate-pulse rounded-full opacity-70 [animation-delay:180ms]"
						/>
					</div>
				</div>
			</article>
		</div>
	</section>
</template>
