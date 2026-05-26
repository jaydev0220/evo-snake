<script setup lang="ts">
	import { Apple, Snowflake, Zap } from '@lucide/vue';
	import { useI18n } from 'vue-i18n';

	import { BONUS_CHAIN_LENGTH, GAME_EVENT_THEMES } from '../lib/data';
	import { EVENT_GUIDE_ITEMS, type EventGuideItem } from '../lib/how-to-play';
	import HowToPlayPanelHeader from './HowToPlayPanelHeader.vue';

	const { t } = useI18n({ useScope: 'global' });

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

	function getPreviewChip(eventId: EventGuideItem['id']) {
		const theme = GAME_EVENT_THEMES[eventId];

		return {
			color: theme.accent,
			borderColor: `color-mix(in srgb, ${theme.accent} 55%, #ffffff 20%)`,
			backgroundColor: `color-mix(in srgb, ${theme.surface} 80%, #101613 20%)`
		};
	}

	function getPreviewNode(eventId: EventGuideItem['id']) {
		const theme = GAME_EVENT_THEMES[eventId];

		return {
			borderColor: theme.accent,
			backgroundColor: `color-mix(in srgb, ${theme.accent} 30%, transparent)`,
			boxShadow: `0 0 14px ${theme.glow}`
		};
	}

	function getPreviewLabelStyle(eventId: EventGuideItem['id']) {
		return {
			color: GAME_EVENT_THEMES[eventId].accent
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
						:style="{
							backgroundImage:
								'linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px)',
							backgroundSize: '22px 22px'
						}"
					/>
					<div
						class="pointer-events-none absolute inset-0 rounded-xl border"
						:style="getPreviewAccent(event.id)"
					/>
					<div
						class="absolute top-2.5 left-2.5 rounded-full border px-2 py-1 text-[10px] font-black tracking-[0.12em] uppercase"
						:style="getPreviewChip(event.id)"
					>
						{{ t(`events.${event.id}.name`) }}
					</div>

					<div
						v-if="event.id === 'bonusChain'"
						class="absolute right-3 bottom-3 flex items-center gap-1.5"
					>
						<span
							v-for="step in BONUS_CHAIN_LENGTH"
							:key="step"
							class="size-3 animate-pulse rounded-full border-2"
							:class="step > 1 ? '[animation-delay:160ms]' : ''"
							:style="getPreviewNode(event.id)"
						/>
					</div>

					<div
						v-else-if="event.id === 'goldRush'"
						class="absolute right-3 bottom-3 flex items-center gap-1.5"
					>
						<Apple
							v-for="index in 3"
							:key="index"
							:size="18"
							class="animate-pulse"
							:class="index > 1 ? '[animation-delay:160ms]' : ''"
							color="#FACC15"
							fill="rgba(250, 204, 21, 0.36)"
							:style="{ filter: 'drop-shadow(0 0 8px rgba(250, 204, 21, 0.45))' }"
						/>
					</div>

					<div
						v-else
						class="absolute right-3 bottom-3 flex items-center gap-1.5"
					>
						<Snowflake
							:size="18"
							class="animate-pulse"
							color="#A5F3FC"
							:style="{ filter: 'drop-shadow(0 0 8px rgba(165, 243, 252, 0.35))' }"
						/>
						<Zap
							:size="18"
							class="animate-pulse [animation-delay:180ms]"
							color="#A5F3FC"
							:style="{ filter: 'drop-shadow(0 0 8px rgba(165, 243, 252, 0.35))' }"
						/>
					</div>
				</div>
			</article>
		</div>
	</section>
</template>
