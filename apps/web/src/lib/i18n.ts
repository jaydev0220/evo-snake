import { createI18n } from 'vue-i18n';

import en from '../locales/en';
import zhTW from '../locales/zh-TW';

const LOCALE_STORAGE_KEY = 'evosnake_locale';

export const SUPPORTED_LOCALES = ['zh-TW', 'en'] as const;
export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = 'zh-TW';
export const FALLBACK_LOCALE: AppLocale = 'en';

const numberFormats = {
	'zh-TW': {
		decimal: {
			style: 'decimal',
			maximumFractionDigits: 0
		},
		multiplier: {
			style: 'decimal',
			minimumFractionDigits: 2,
			maximumFractionDigits: 2
		}
	},
	en: {
		decimal: {
			style: 'decimal',
			maximumFractionDigits: 0
		},
		multiplier: {
			style: 'decimal',
			minimumFractionDigits: 2,
			maximumFractionDigits: 2
		}
	}
} as const;

function isSupportedLocale(value: string | null | undefined): value is AppLocale {
	return value === 'zh-TW' || value === 'en';
}

function getBrowserLocale(): AppLocale {
	const candidates = [navigator.language, ...(navigator.languages ?? [])];

	for (const candidate of candidates) {
		if (candidate.toLowerCase().startsWith('zh')) {
			return 'zh-TW';
		}

		if (candidate.toLowerCase().startsWith('en')) {
			return 'en';
		}
	}

	return DEFAULT_LOCALE;
}

function getStartingLocale(): AppLocale {
	if (typeof window === 'undefined') {
		return DEFAULT_LOCALE;
	}

	try {
		const storedLocale = window.localStorage.getItem(LOCALE_STORAGE_KEY);

		if (isSupportedLocale(storedLocale)) {
			return storedLocale;
		}
	} catch {
		// Ignore storage access errors and fall back to browser detection.
	}

	return getBrowserLocale();
}

export const i18n = createI18n({
	legacy: false,
	globalInjection: true,
	locale: getStartingLocale(),
	fallbackLocale: FALLBACK_LOCALE,
	messages: {
		'zh-TW': zhTW,
		en
	},
	numberFormats
});

export function setAppLocale(locale: AppLocale) {
	i18n.global.locale.value = locale;

	try {
		window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
	} catch {
		// Ignore storage access errors.
	}
}
