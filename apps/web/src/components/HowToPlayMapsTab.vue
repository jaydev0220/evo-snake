<script setup lang="ts">
	import { useI18n } from 'vue-i18n';

	import { MAP_GUIDE_ITEMS } from '../lib/how-to-play';
	import HowToPlayPanelHeader from './HowToPlayPanelHeader.vue';

	const { t } = useI18n({ useScope: 'global' });
</script>

<template>
	<section>
		<HowToPlayPanelHeader
			:title="t('howToPlay.maps')"
			:detail="t('howToPlay.mapsCount', { count: MAP_GUIDE_ITEMS.length })"
		/>

		<div class="grid gap-2.5">
			<article
				v-for="map in MAP_GUIDE_ITEMS"
				:key="map.id"
				class="rounded-evosnake border-evosnake-border bg-evosnake-surface2 grid gap-2 border p-3"
			>
				<div class="font-extrabold">{{ t(`maps.${map.id}.name`) }}</div>
				<p class="text-evosnake-muted text-sm leading-6">
					{{ t(`maps.${map.id}.description`) }}
				</p>
			</article>
		</div>
	</section>
</template>
