<script setup lang="ts">
	import { Apple as AppleIcon } from '@lucide/vue';
	import { type CSSProperties } from 'vue';
	import { useI18n } from 'vue-i18n';

	import { APPLE_COLORS, GAME_EVENT_THEMES, type AppleType } from '../lib/data';
	import { EVENT_GUIDE_ITEMS, type EventGuideItem } from '../lib/how-to-play';
	import HowToPlayPanelHeader from './HowToPlayPanelHeader.vue';

	const { t } = useI18n({ useScope: 'global' });

	interface PreviewApple {
		type: AppleType;
		column: number;
		animationClass: string;
		glowClass?: string;
	}

	const BONUS_CHAIN_PREVIEW_APPLES: PreviewApple[] = [
		{
			type: 'classic',
			column: 3,
			animationClass: 'animate-evosnake-event-bonus-apple-1',
			glowClass: 'animate-evosnake-event-bonus-glow-1'
		},
		{
			type: 'chill',
			column: 4,
			animationClass: 'animate-evosnake-event-bonus-apple-2',
			glowClass: 'animate-evosnake-event-bonus-glow-2'
		},
		{
			type: 'golden',
			column: 5,
			animationClass: 'animate-evosnake-event-bonus-apple-3',
			glowClass: 'animate-evosnake-event-bonus-glow-3'
		},
		{
			type: 'ghost',
			column: 6,
			animationClass: 'animate-evosnake-event-bonus-apple-4',
			glowClass: 'animate-evosnake-event-bonus-glow-4'
		}
	];

	const GOLD_RUSH_PREVIEW_APPLES: PreviewApple[] = [
		{ type: 'golden', column: 4, animationClass: 'animate-evosnake-event-gold-apple-1' },
		{ type: 'golden', column: 5, animationClass: 'animate-evosnake-event-gold-apple-2' },
		{ type: 'golden', column: 6, animationClass: 'animate-evosnake-event-gold-apple-3' }
	];

	function getPreviewSurface(eventId: EventGuideItem['id']) {
		const theme = GAME_EVENT_THEMES[eventId];

		return {
			background: `radial-gradient(circle at top left, ${theme.surface} 0%, transparent 58%), linear-gradient(180deg, color-mix(in srgb, ${theme.surface} 40%, #0f1512) 0%, #151d18 100%)`
		};
	}

	function getPreviewAccent(eventId: EventGuideItem['id']) {
		const theme = GAME_EVENT_THEMES[eventId];

		return {
			borderColor: theme.accent,
			boxShadow: `inset 0 0 24px ${theme.glow}`
		};
	}

	function getPreviewLabelStyle(eventId: EventGuideItem['id']) {
		return {
			color: GAME_EVENT_THEMES[eventId].accent
		};
	}

	function getGridCellStyle(column: number): CSSProperties {
		return {
			gridColumn: `${column}`,
			gridRow: '2'
		};
	}

	function getPreviewGridStyle(): CSSProperties {
		return {
			backgroundImage:
				'linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px)',
			backgroundSize: `${100 / 6}% 33.333%`
		};
	}
</script>

<template>
	<section>
		<HowToPlayPanelHeader
			:title="t('howToPlay.events')"
			:detail="t('howToPlay.eventsCount', { count: EVENT_GUIDE_ITEMS.length })"
		/>

		<div class="grid gap-2.5">
			<article
				v-for="event in EVENT_GUIDE_ITEMS"
				:key="event.id"
				class="rounded-evosnake border-evosnake-border bg-evosnake-surface2 grid grid-cols-1 items-center gap-3 border p-3 md:grid-cols-[minmax(0,1fr)_160px]"
			>
				<div class="min-w-0">
					<div
						class="font-extrabold"
						:style="getPreviewLabelStyle(event.id)"
					>
						{{ t(`events.${event.id}.name`) }}
					</div>
					<p class="text-evosnake-muted mt-1 text-sm leading-6">
						{{ t(`events.${event.id}.description`) }}
					</p>
				</div>

				<div
					class="border-evosnake-border relative h-19 overflow-hidden rounded-xl border md:h-21.5"
					:style="getPreviewSurface(event.id)"
					aria-hidden="true"
				>
					<div
						class="absolute inset-0 opacity-45"
						:style="getPreviewGridStyle()"
					/>
					<div
						class="pointer-events-none absolute inset-0 rounded-xl border"
						:style="getPreviewAccent(event.id)"
					/>

					<div
						v-if="event.id === 'bonusChain'"
						class="absolute inset-0"
					>
						<div
							class="animate-evosnake-event-snake-bonus absolute top-4/7 left-0 grid h-4 w-1/2 -translate-y-1/2 grid-cols-3 place-items-center leading-none motion-reduce:animate-none"
						>
							<span class="bg-evosnake-primary block size-6 rounded-[32%] opacity-80" />
							<span class="bg-evosnake-primary block size-6 rounded-[32%] opacity-90" />
							<span
								class="bg-evosnake-primary relative block size-6 rounded-[32%] shadow-[0_0_12px_rgba(84,217,120,0.5)]"
							>
								<span class="absolute top-1 left-3 size-1 rounded-full bg-white" />
								<span class="absolute bottom-1 left-3 size-1 rounded-full bg-white" />
							</span>
						</div>

						<div class="absolute inset-0 grid grid-cols-6 grid-rows-3">
							<div
								v-for="apple in BONUS_CHAIN_PREVIEW_APPLES"
								:key="`${event.id}-${apple.type}-${apple.column}`"
								class="relative grid place-items-center"
								:style="getGridCellStyle(apple.column)"
							>
								<div
									class="relative z-10 grid place-items-center motion-reduce:animate-none"
									:class="apple.animationClass"
								>
									<AppleIcon
										:size="22"
										:color="APPLE_COLORS[apple.type].outline"
										:fill="APPLE_COLORS[apple.type].fill"
									/>
								</div>
							</div>
						</div>
					</div>

					<div
						v-else-if="event.id === 'goldRush'"
						class="absolute inset-0"
					>
						<div
							class="animate-evosnake-event-snake-gold absolute top-4/7 left-0 grid h-4 w-1/2 -translate-y-1/2 grid-cols-3 place-items-center leading-none motion-reduce:animate-none"
						>
							<span class="bg-evosnake-primary block size-6 rounded-[32%] opacity-80" />
							<span class="bg-evosnake-primary block size-6 rounded-[32%] opacity-90" />
							<span
								class="bg-evosnake-primary relative block size-6 rounded-[32%] shadow-[0_0_12px_rgba(84,217,120,0.5)]"
							>
								<span class="absolute top-1 left-3 size-1 rounded-full bg-white" />
								<span class="absolute bottom-1 left-3 size-1 rounded-full bg-white" />
							</span>
						</div>

						<div class="absolute inset-0 grid grid-cols-6 grid-rows-3">
							<div
								v-for="apple in GOLD_RUSH_PREVIEW_APPLES"
								:key="`${event.id}-${apple.column}`"
								class="relative grid place-items-center"
								:style="getGridCellStyle(apple.column)"
							>
								<div
									v-if="apple.column < 6"
									class="relative z-10 grid place-items-center motion-reduce:animate-none"
									:class="apple.animationClass"
								>
									<AppleIcon
										:size="22"
										:color="APPLE_COLORS[apple.type].outline"
										:fill="APPLE_COLORS[apple.type].fill"
									/>
								</div>
								<div
									v-else
									class="relative grid size-7 place-items-center"
								>
									<AppleIcon
										class="animate-evosnake-event-gold-apple-3 absolute motion-reduce:animate-none"
										:size="22"
										:color="APPLE_COLORS.golden.outline"
										:fill="APPLE_COLORS.golden.fill"
									/>
									<AppleIcon
										class="animate-evosnake-event-gold-rotten-3 absolute motion-reduce:animate-none"
										:size="22"
										:color="APPLE_COLORS.rotten.outline"
										:fill="APPLE_COLORS.rotten.fill"
									/>
								</div>
							</div>
						</div>
					</div>

					<div
						v-else
						class="absolute inset-0"
					>
						<div
							class="animate-evosnake-event-snake-ice absolute top-4/7 left-0 grid h-4 w-1/2 -translate-y-1/2 grid-cols-3 place-items-center leading-none motion-reduce:animate-none"
						>
							<span class="block size-6 rounded-[32%] bg-[#87CEEB] opacity-80" />
							<span class="block size-6 rounded-[32%] bg-[#87CEEB] opacity-90" />
							<span
								class="relative block size-6 rounded-[32%] bg-[#87CEEB] shadow-[0_0_12px_rgba(135,206,235,0.55)]"
							>
								<span class="absolute top-1 left-3 size-1 rounded-full bg-white" />
								<span class="absolute bottom-1 left-3 size-1 rounded-full bg-white" />
							</span>
						</div>

						<div class="absolute inset-0 grid grid-cols-6 grid-rows-3">
							<div
								class="relative grid place-items-center"
								:style="getGridCellStyle(4)"
							>
								<div
									class="animate-evosnake-event-ice-apple relative z-10 grid place-items-center motion-reduce:animate-none"
								>
									<AppleIcon
										:size="22"
										:color="APPLE_COLORS.chill.outline"
										:fill="APPLE_COLORS.chill.fill"
									/>
								</div>
							</div>
						</div>
					</div>
				</div>
			</article>
		</div>
	</section>
</template>
