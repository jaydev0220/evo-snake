import { watch } from 'vue';

import { i18n, SUPPORTED_LOCALES, type AppLocale } from './i18n';

const APP_NAME = 'EvoSnake';
const DEFAULT_THEME_COLOR = '#0f1411';
const OG_IMAGE_PATH = '/og-image.webp';
const OG_IMAGE_TYPE = 'image/webp';
const ROBOTS_CONTENT =
	'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';

const OG_LOCALES: Record<AppLocale, string> = {
	'zh-TW': 'zh_TW',
	en: 'en_US'
};

type MetaDefinition = {
	attr: 'name' | 'property';
	key: string;
	content: string;
};

function normalizeSiteUrl(siteUrl?: string) {
	return siteUrl?.trim().replace(/\/+$/, '') || window.location.origin;
}

function getCurrentPageUrl(siteUrl: string) {
	return new URL(window.location.pathname || '/', `${siteUrl}/`).toString();
}

function resolveAbsoluteUrl(path: string, siteUrl: string) {
	return new URL(path, `${siteUrl}/`).toString();
}

function upsertMeta({ attr, key, content }: MetaDefinition) {
	const selector = `meta[${attr}="${key}"]`;
	let element = document.head.querySelector<HTMLMetaElement>(selector);

	if (!element) {
		element = document.createElement('meta');
		element.setAttribute(attr, key);
		document.head.appendChild(element);
	}

	element.setAttribute('content', content);
}

function replaceMetaGroup(attr: 'name' | 'property', key: string, contents: string[]) {
	document.head.querySelectorAll(`meta[${attr}="${key}"]`).forEach((element) => element.remove());

	for (const content of contents) {
		const element = document.createElement('meta');
		element.setAttribute(attr, key);
		element.setAttribute('content', content);
		document.head.appendChild(element);
	}
}

function upsertCanonical(url: string) {
	let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');

	if (!canonical) {
		canonical = document.createElement('link');
		canonical.setAttribute('rel', 'canonical');
		document.head.appendChild(canonical);
	}

	canonical.setAttribute('href', url);
}

function upsertStructuredData(
	locale: AppLocale,
	siteUrl: string,
	pageUrl: string,
	imageUrl: string
) {
	let script = document.head.querySelector<HTMLScriptElement>('#structured-data');

	if (!script) {
		script = document.createElement('script');
		script.id = 'structured-data';
		script.type = 'application/ld+json';
		document.head.appendChild(script);
	}

	script.textContent = JSON.stringify(
		{
			'@context': 'https://schema.org',
			'@graph': [
				{
					'@type': 'WebSite',
					'@id': `${siteUrl}/#website`,
					name: APP_NAME,
					url: `${siteUrl}/`,
					description: translate('seo.description'),
					inLanguage: locale,
					availableLanguage: SUPPORTED_LOCALES,
					mainEntity: { '@id': `${pageUrl}#game` }
				},
				{
					'@type': 'VideoGame',
					'@id': `${pageUrl}#game`,
					name: APP_NAME,
					url: pageUrl,
					description: translate('seo.description'),
					image: [imageUrl],
					inLanguage: locale,
					availableLanguage: SUPPORTED_LOCALES,
					gamePlatform: ['Web Browser'],
					playMode: 'SinglePlayer',
					genre: ['Arcade', 'Snake'],
					isAccessibleForFree: true,
					operatingSystem: 'Any',
					keywords: translate('seo.keywords'),
					potentialAction: {
						'@type': 'PlayAction',
						target: pageUrl
					},
					offers: {
						'@type': 'Offer',
						price: '0',
						priceCurrency: 'USD',
						availability: 'https://schema.org/InStock'
					},
					mainEntityOfPage: pageUrl
				}
			]
		},
		null,
		0
	);
}

function getCurrentLocale() {
	const locale = i18n.global.locale;
	return (typeof locale === 'string' ? locale : locale.value) as AppLocale;
}

function translate(key: string) {
	return String(i18n.global.t(key as never));
}

function applySeo(locale: AppLocale) {
	const siteUrl = normalizeSiteUrl(import.meta.env.VITE_SITE_URL);
	const pageUrl = getCurrentPageUrl(siteUrl);
	const imageUrl = resolveAbsoluteUrl(OG_IMAGE_PATH, siteUrl);
	const alternateLocales = SUPPORTED_LOCALES.filter((entry) => entry !== locale).map(
		(entry) => OG_LOCALES[entry]
	);

	document.title = translate('seo.title');
	document.documentElement.lang = locale;

	const metas: MetaDefinition[] = [
		{ attr: 'name', key: 'description', content: translate('seo.description') },
		{ attr: 'name', key: 'keywords', content: translate('seo.keywords') },
		{ attr: 'name', key: 'language', content: locale },
		{ attr: 'name', key: 'robots', content: ROBOTS_CONTENT },
		{ attr: 'name', key: 'googlebot', content: ROBOTS_CONTENT },
		{ attr: 'name', key: 'application-name', content: APP_NAME },
		{ attr: 'name', key: 'apple-mobile-web-app-title', content: APP_NAME },
		{ attr: 'name', key: 'theme-color', content: DEFAULT_THEME_COLOR },
		{ attr: 'property', key: 'og:site_name', content: APP_NAME },
		{ attr: 'property', key: 'og:type', content: 'website' },
		{ attr: 'property', key: 'og:locale', content: OG_LOCALES[locale] },
		{ attr: 'property', key: 'og:title', content: translate('seo.title') },
		{ attr: 'property', key: 'og:description', content: translate('seo.description') },
		{ attr: 'property', key: 'og:url', content: pageUrl },
		{ attr: 'property', key: 'og:image', content: imageUrl },
		{ attr: 'property', key: 'og:image:type', content: OG_IMAGE_TYPE },
		{ attr: 'property', key: 'og:image:width', content: '1200' },
		{ attr: 'property', key: 'og:image:height', content: '630' },
		{ attr: 'property', key: 'og:image:alt', content: translate('seo.ogImageAlt') },
		{ attr: 'name', key: 'twitter:card', content: 'summary_large_image' },
		{ attr: 'name', key: 'twitter:title', content: translate('seo.title') },
		{ attr: 'name', key: 'twitter:description', content: translate('seo.description') },
		{ attr: 'name', key: 'twitter:image', content: imageUrl },
		{ attr: 'name', key: 'twitter:image:alt', content: translate('seo.ogImageAlt') }
	];

	for (const meta of metas) {
		upsertMeta(meta);
	}

	replaceMetaGroup('property', 'og:locale:alternate', alternateLocales);
	upsertCanonical(pageUrl);
	upsertStructuredData(locale, siteUrl, pageUrl, imageUrl);
}

export function setupSeo() {
	watch(
		() => getCurrentLocale(),
		(locale) => {
			applySeo(locale);
		},
		{ immediate: true }
	);
}
