<script setup lang="ts">
	import { Languages } from '@lucide/vue';
	import { computed } from 'vue';
	import { useI18n } from 'vue-i18n';

	import { setAppLocale, type AppLocale } from '../lib/i18n';

	const { locale, t } = useI18n({ useScope: 'global' });

	const options = computed(
		(): Array<{ value: AppLocale; shortLabel: string; longLabel: string }> => [
			{
				value: 'zh-TW',
				shortLabel: t('locale.zhTWShort'),
				longLabel: t('locale.zhTWLong')
			},
			{
				value: 'en',
				shortLabel: t('locale.enShort'),
				longLabel: t('locale.enLong')
			}
		]
	);

	function selectLocale(nextLocale: AppLocale) {
		if (locale.value === nextLocale) {
			return;
		}

		setAppLocale(nextLocale);
	}
</script>

<template>
	<nav
		class="rounded-evosnake border-evosnake-border bg-evosnake-surface/92 shadow-evosnakeCard flex items-center gap-1 border p-1 backdrop-blur-sm"
		:aria-label="t('locale.switcher')"
	>
		<span
			class="text-evosnake-muted grid size-8 place-items-center"
			aria-hidden="true"
		>
			<Languages :size="16" />
		</span>

		<button
			v-for="option in options"
			:key="option.value"
			type="button"
			class="rounded-evosnake min-w-13 px-3 py-1.5 text-sm font-bold transition-colors"
			:class="
				locale === option.value
					? 'bg-evosnake-primary text-[#08100b]'
					: 'text-evosnake-muted hover:bg-evosnake-surface2 hover:text-evosnake-text'
			"
			:aria-pressed="locale === option.value"
			:title="option.longLabel"
			@click="selectLocale(option.value)"
		>
			{{ option.shortLabel }}
		</button>
	</nav>
</template>
