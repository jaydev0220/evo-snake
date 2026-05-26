const APP_NAME = 'EvoSnake';
const DEFAULT_TITLE = 'EvoSnake | Browser Snake Game';
const DEFAULT_DESCRIPTION =
	'Play EvoSnake, a free browser snake game with special apples, live events, difficulty modes, and leaderboard competition straight from your web browser.';
const DEFAULT_KEYWORDS =
	'snake game, browser snake game, web game, arcade game, leaderboard game, bonus chain, gold rush, ice age';
const DEFAULT_LOCALE = 'zh_TW';
const DEFAULT_LANGUAGE = 'zh_TW';
const DEFAULT_THEME_COLOR = '#0f1411';
const OG_IMAGE_PATH = '/og-image.svg';
const OG_IMAGE_ALT = 'EvoSnake preview artwork showing a snake board, apples, and event callouts';

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

function upsertCanonical(url: string) {
	let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');

	if (!canonical) {
		canonical = document.createElement('link');
		canonical.setAttribute('rel', 'canonical');
		document.head.appendChild(canonical);
	}

	canonical.setAttribute('href', url);
}

function upsertStructuredData(siteUrl: string, pageUrl: string, imageUrl: string) {
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
					description: DEFAULT_DESCRIPTION,
					inLanguage: DEFAULT_LANGUAGE,
					mainEntity: { '@id': `${pageUrl}#game` }
				},
				{
					'@type': 'VideoGame',
					'@id': `${pageUrl}#game`,
					name: APP_NAME,
					url: pageUrl,
					description: DEFAULT_DESCRIPTION,
					image: [imageUrl],
					inLanguage: DEFAULT_LANGUAGE,
					gamePlatform: ['Web Browser'],
					playMode: 'SinglePlayer',
					genre: ['Arcade', 'Snake'],
					isAccessibleForFree: true,
					operatingSystem: 'Any',
					keywords: DEFAULT_KEYWORDS,
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

export function applyDefaultSeo() {
	const siteUrl = normalizeSiteUrl(import.meta.env.VITE_SITE_URL);
	const pageUrl = getCurrentPageUrl(siteUrl);
	const imageUrl = resolveAbsoluteUrl(OG_IMAGE_PATH, siteUrl);

	document.title = DEFAULT_TITLE;
	document.documentElement.lang = DEFAULT_LANGUAGE;

	const metas: MetaDefinition[] = [
		{ attr: 'name', key: 'description', content: DEFAULT_DESCRIPTION },
		{ attr: 'name', key: 'keywords', content: DEFAULT_KEYWORDS },
		{
			attr: 'name',
			key: 'robots',
			content: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
		},
		{
			attr: 'name',
			key: 'googlebot',
			content: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
		},
		{ attr: 'name', key: 'application-name', content: APP_NAME },
		{ attr: 'name', key: 'apple-mobile-web-app-title', content: APP_NAME },
		{ attr: 'name', key: 'theme-color', content: DEFAULT_THEME_COLOR },
		{ attr: 'property', key: 'og:site_name', content: APP_NAME },
		{ attr: 'property', key: 'og:type', content: 'website' },
		{ attr: 'property', key: 'og:locale', content: DEFAULT_LOCALE },
		{ attr: 'property', key: 'og:title', content: DEFAULT_TITLE },
		{ attr: 'property', key: 'og:description', content: DEFAULT_DESCRIPTION },
		{ attr: 'property', key: 'og:url', content: pageUrl },
		{ attr: 'property', key: 'og:image', content: imageUrl },
		{ attr: 'property', key: 'og:image:type', content: 'image/svg+xml' },
		{ attr: 'property', key: 'og:image:width', content: '1200' },
		{ attr: 'property', key: 'og:image:height', content: '630' },
		{ attr: 'property', key: 'og:image:alt', content: OG_IMAGE_ALT },
		{ attr: 'name', key: 'twitter:card', content: 'summary_large_image' },
		{ attr: 'name', key: 'twitter:title', content: DEFAULT_TITLE },
		{ attr: 'name', key: 'twitter:description', content: DEFAULT_DESCRIPTION },
		{ attr: 'name', key: 'twitter:image', content: imageUrl },
		{ attr: 'name', key: 'twitter:image:alt', content: OG_IMAGE_ALT }
	];

	for (const meta of metas) {
		upsertMeta(meta);
	}

	upsertCanonical(pageUrl);
	upsertStructuredData(siteUrl, pageUrl, imageUrl);
}
