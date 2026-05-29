<script setup lang="ts">
	import type { MapId } from '@packages/types';
	import { computed } from 'vue';
	import { useI18n } from 'vue-i18n';

	const modelValue = defineModel<MapId>({ required: true });
	const { t } = useI18n({ useScope: 'global' });

	const options = computed<Array<{ value: MapId; label: string; description: string }>>(() => [
		{
			value: 'classic',
			label: t('maps.classic.name'),
			description: t('maps.classic.description')
		},
		{
			value: 'portals',
			label: t('maps.portals.name'),
			description: t('maps.portals.description')
		},
		{
			value: 'greedinessGates',
			label: t('maps.greedinessGates.name'),
			description: t('maps.greedinessGates.description')
		}
	]);
</script>

<template>
	<fieldset :aria-label="t('maps.label')">
		<legend class="text-evosnake-muted mb-2 text-xs font-bold tracking-wide uppercase">
			{{ t('maps.label') }}
		</legend>

		<div
			class="grid grid-cols-1 gap-2.5 md:grid-cols-3"
			role="radiogroup"
			:aria-label="t('difficulty.label')"
		>
			<label
				v-for="option in options"
				:key="option.value"
				class="relative"
			>
				<input
					v-model="modelValue"
					type="radio"
					name="map"
					:value="option.value"
					class="peer sr-only"
				/>
				<span
					class="rounded-evosnake border-evosnake-border bg-evosnake-surface2 text-evosnake-text peer-checked:bg-evosnake-primary peer-checked:border-evosnake-primary hover:border-evosnake-primary grid min-h-12 cursor-pointer place-items-center border font-bold select-none peer-checked:text-[#08100b]"
				>
					{{ option.label }}
				</span>
			</label>
		</div>
	</fieldset>
</template>
