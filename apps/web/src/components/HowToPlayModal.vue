<script setup lang="ts">
	import { X } from '@lucide/vue';
	import type { Difficulty } from '@packages/types';
	import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
	import { useI18n } from 'vue-i18n';

	import {
		ASIAN_ROAST_LINE_COUNT,
		getRandomMessageIndex,
		isAsianDifficulty
	} from '../lib/asian-mode';
	import { FRUIT_GUIDE } from '../lib/data';
	import {
		CONTROL_GUIDE_CARDS,
		EVENT_GUIDE_ITEMS,
		MAP_GUIDE_ITEMS,
		type GuideTab
	} from '../lib/how-to-play';
	import HowToPlayApplesTab from './HowToPlayApplesTab.vue';
	import HowToPlayControlsTab from './HowToPlayControlsTab.vue';
	import HowToPlayEventsTab from './HowToPlayEventsTab.vue';
	import HowToPlayMapsTab from './HowToPlayMapsTab.vue';

	const isOpen = defineModel<boolean>({ required: true });
	const props = defineProps<{
		difficulty: Difficulty;
	}>();
	const { t } = useI18n({ useScope: 'global' });

	const activeTab = ref<GuideTab>('controls');
	const roastLineIndex = ref(0);
	const modalRef = ref<HTMLElement | null>(null);
	let triggerElement: HTMLElement | null = null;

	const tabs = computed(() => [
		{
			id: 'controls' as const,
			label: t('howToPlay.controls'),
			detail: t('howToPlay.methodsCount', { count: CONTROL_GUIDE_CARDS.length })
		},
		{
			id: 'apples' as const,
			label: t('howToPlay.apples'),
			detail: t('howToPlay.typesCount', { count: FRUIT_GUIDE.length })
		},
		{
			id: 'events' as const,
			label: t('howToPlay.events'),
			detail: t('howToPlay.eventsCount', { count: EVENT_GUIDE_ITEMS.length })
		},
		{
			id: 'maps' as const,
			label: t('howToPlay.maps'),
			detail: t('howToPlay.mapsCount', { count: MAP_GUIDE_ITEMS.length })
		}
	]);
	const isAsianGuide = computed(() => isAsianDifficulty(props.difficulty));

	function close() {
		isOpen.value = false;
	}

	function selectTab(tab: GuideTab) {
		activeTab.value = tab;
	}

	function getTabId(tab: GuideTab) {
		return `play-guide-tab-${tab}`;
	}

	function getPanelId(tab: GuideTab) {
		return `play-guide-panel-${tab}`;
	}

	function getFocusableElements() {
		if (!modalRef.value) return [];
		const focusableSelector =
			'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

		return Array.from(modalRef.value.querySelectorAll<HTMLElement>(focusableSelector)).filter(
			(element) => {
				const style = window.getComputedStyle(element);
				return style.display !== 'none' && style.visibility !== 'hidden';
			}
		);
	}

	function onDocumentKeydown(event: KeyboardEvent) {
		if (!isOpen.value) return;

		if (event.key === 'Escape') {
			event.preventDefault();
			close();
			return;
		}

		if (event.key !== 'Tab') return;

		const focusableElements = getFocusableElements();

		if (focusableElements.length === 0) {
			event.preventDefault();
			modalRef.value?.focus();
			return;
		}

		const first = focusableElements[0]!;
		const last = focusableElements.at(-1)!;
		const activeElement = document.activeElement as HTMLElement | null;

		if (event.shiftKey) {
			if (!activeElement || activeElement === first || !modalRef.value?.contains(activeElement)) {
				event.preventDefault();
				last.focus();
			}
			return;
		}

		if (!activeElement || activeElement === last || !modalRef.value?.contains(activeElement)) {
			event.preventDefault();
			first.focus();
		}
	}

	watch(isOpen, async (open) => {
		if (open) {
			triggerElement = document.activeElement as HTMLElement | null;
			roastLineIndex.value = getRandomMessageIndex(ASIAN_ROAST_LINE_COUNT);
			document.addEventListener('keydown', onDocumentKeydown);
			await nextTick();
			modalRef.value?.focus();
			return;
		}

		document.removeEventListener('keydown', onDocumentKeydown);
		activeTab.value = 'controls';
		triggerElement?.focus();
	});

	onBeforeUnmount(() => {
		document.removeEventListener('keydown', onDocumentKeydown);
	});
</script>

<template>
	<Teleport to="body">
		<div
			v-if="isOpen"
			class="fixed inset-0 z-50 grid place-items-center bg-black/60 px-4 py-5"
			@click.self="close"
		>
			<section
				ref="modalRef"
				role="dialog"
				aria-modal="true"
				aria-labelledby="play-guide-title"
				tabindex="-1"
				class="rounded-evosnakePanel border-evosnake-border bg-evosnake-surface shadow-evosnakePanel grid max-h-[calc(100vh-40px)] w-full overflow-hidden border outline-none md:max-h-180"
				:class="
					isAsianGuide
						? 'max-w-lg grid-rows-[auto_minmax(0,1fr)]'
						: 'max-w-205 grid-rows-[auto_auto_minmax(0,1fr)]'
				"
			>
				<header
					class="border-evosnake-border grid grid-cols-[1fr_auto] items-center gap-4 border-b px-4 py-4 md:px-5"
				>
					<div class="min-w-0">
						<h2
							id="play-guide-title"
							class="text-evosnake-text text-2xl leading-none font-extrabold tracking-[-0.04em]"
						>
							{{ t('howToPlay.title') }}
						</h2>
						<p class="text-evosnake-muted mt-1.5 hidden text-sm leading-snug md:block">
							{{ t('howToPlay.subtitle') }}
						</p>
					</div>

					<button
						type="button"
						:aria-label="t('howToPlay.close')"
						class="rounded-evosnake border-evosnake-border bg-evosnake-surface2 text-evosnake-text hover:border-evosnake-primary grid size-10 place-items-center border"
						@click="close"
					>
						<X
							class="h-5 w-5"
							aria-hidden="true"
						/>
					</button>
				</header>

				<nav
					v-if="!isAsianGuide"
					class="border-evosnake-border grid grid-cols-2 gap-1.5 border-b p-2.5 md:grid-cols-4 md:gap-2 md:px-4"
					:aria-label="t('howToPlay.sections')"
					role="tablist"
				>
					<button
						v-for="tab in tabs"
						:key="tab.id"
						:id="getTabId(tab.id)"
						type="button"
						role="tab"
						:aria-selected="activeTab === tab.id"
						:aria-controls="getPanelId(tab.id)"
						class="rounded-evosnake border px-2 py-2.5 text-center transition-colors"
						:class="
							activeTab === tab.id
								? 'border-evosnake-primary bg-evosnake-surface2 text-evosnake-text'
								: 'border-evosnake-border bg-evosnake-bg text-evosnake-muted hover:bg-evosnake-surface2 hover:text-evosnake-text'
						"
						@click="selectTab(tab.id)"
					>
						<strong class="block text-sm font-extrabold">{{ tab.label }}</strong>
						<span class="hidden text-xs sm:block">{{ tab.detail }}</span>
					</button>
				</nav>

				<div class="min-h-0 overflow-y-auto p-4 md:p-5">
					<section
						v-if="isAsianGuide"
						class="rounded-evosnake border-evosnake-danger bg-evosnake-danger/10 grid min-h-64 place-items-center border p-6 text-center"
					>
						<p class="text-evosnake-text text-2xl leading-tight font-black">
							{{ t(`asianMode.guide.roastLines.${roastLineIndex}`) }}
						</p>
					</section>

					<section
						v-else-if="activeTab === 'controls'"
						:id="getPanelId('controls')"
						:aria-labelledby="getTabId('controls')"
						role="tabpanel"
					>
						<HowToPlayControlsTab />
					</section>

					<section
						v-else-if="activeTab === 'apples'"
						:id="getPanelId('apples')"
						:aria-labelledby="getTabId('apples')"
						role="tabpanel"
					>
						<HowToPlayApplesTab />
					</section>

					<section
						v-else-if="activeTab === 'events'"
						:id="getPanelId('events')"
						:aria-labelledby="getTabId('events')"
						role="tabpanel"
					>
						<HowToPlayEventsTab />
					</section>

					<section
						v-else
						:id="getPanelId('maps')"
						:aria-labelledby="getTabId('maps')"
						role="tabpanel"
					>
						<HowToPlayMapsTab />
					</section>
				</div>
			</section>
		</div>
	</Teleport>
</template>
