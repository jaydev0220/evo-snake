<script setup lang="ts">
	import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp } from '@lucide/vue';
	import { useI18n } from 'vue-i18n';

	import { CONTROL_GUIDE_CARDS } from '../lib/how-to-play';
	import HowToPlayPanelHeader from './HowToPlayPanelHeader.vue';

	const { t } = useI18n({ useScope: 'global' });
</script>

<template>
	<section>
		<HowToPlayPanelHeader
			:title="t('howToPlay.controls')"
			:detail="t('howToPlay.methodsCount', { count: CONTROL_GUIDE_CARDS.length })"
		/>

		<div class="grid grid-cols-1 gap-2.5 md:grid-cols-3">
			<article
				v-for="control in CONTROL_GUIDE_CARDS"
				:key="control.id"
				class="rounded-evosnake border-evosnake-border bg-evosnake-surface2 grid min-h-40 place-items-center gap-3 border p-4 text-center"
			>
				<div class="text-evosnake-text font-extrabold tracking-tight">
					{{ t(`controls.${control.id}`) }}
				</div>

				<div
					v-if="control.type === 'keys'"
					class="grid justify-center gap-1.5"
					:aria-label="t(`controls.${control.id}Aria`)"
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
					<div class="flex w-full flex-col items-center gap-3">
						<div
							class="relative h-9 w-full max-w-44 overflow-hidden"
							:aria-label="t(`controls.${control.id}Aria`)"
						>
							<span
								class="animate-evosnake-swipe-gesture absolute top-1/2 left-1/2 block h-5 w-28 motion-reduce:animate-none"
								aria-hidden="true"
							>
								<span
									class="absolute top-1/2 right-4 h-2.5 w-10 -translate-y-1/2 rounded-full bg-linear-to-r from-white/0 via-white/45 to-white/90 blur-[1px]"
								/>
								<span
									class="absolute top-1/2 right-0 size-5 -translate-y-1/2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.88),0_0_16px_rgba(84,217,120,0.4)]"
								/>
							</span>
						</div>
						<span>{{ t('controls.swipe') }}</span>
					</div>
				</div>
			</article>
		</div>
	</section>
</template>
