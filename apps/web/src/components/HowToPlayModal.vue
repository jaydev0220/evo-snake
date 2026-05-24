<script setup lang="ts">
	import { X } from '@lucide/vue';
	import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';

	import { FRUIT_GUIDE } from '../lib/data';
	import { CONTROL_GUIDE_CARDS, EVENT_GUIDE_ITEMS, type GuideTab } from '../lib/how-to-play';
	import HowToPlayApplesTab from './HowToPlayApplesTab.vue';
	import HowToPlayControlsTab from './HowToPlayControlsTab.vue';
	import HowToPlayEventsTab from './HowToPlayEventsTab.vue';

	const isOpen = defineModel<boolean>({ required: true });

	const activeTab = ref<GuideTab>('controls');
	const modalRef = ref<HTMLElement | null>(null);
	let triggerElement: HTMLElement | null = null;

	const tabs = computed(() => [
		{ id: 'controls' as const, label: 'Controls', detail: `${CONTROL_GUIDE_CARDS.length} methods` },
		{ id: 'apples' as const, label: 'Apples', detail: `${FRUIT_GUIDE.length} types` },
		{ id: 'events' as const, label: 'Events', detail: `${EVENT_GUIDE_ITEMS.length} events` }
	]);

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
				class="rounded-evosnakePanel border-evosnake-border bg-evosnake-surface shadow-evosnakePanel grid max-h-[calc(100vh-40px)] w-full max-w-205 grid-rows-[auto_auto_minmax(0,1fr)] overflow-hidden border outline-none md:max-h-180"
			>
				<header
					class="border-evosnake-border grid grid-cols-[1fr_auto] items-center gap-4 border-b px-4 py-4 md:px-5"
				>
					<div class="min-w-0">
						<h2
							id="play-guide-title"
							class="text-evosnake-text text-2xl leading-none font-extrabold tracking-[-0.04em]"
						>
							How to Play
						</h2>
						<p class="text-evosnake-muted mt-1.5 hidden text-sm leading-snug md:block">
							Learn the controls, apple effects, and live events before your next run.
						</p>
					</div>

					<button
						type="button"
						aria-label="Close play guide"
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
					class="border-evosnake-border grid grid-cols-3 gap-1.5 border-b p-2.5 md:gap-2 md:px-4"
					aria-label="Play guide sections"
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
						v-if="activeTab === 'controls'"
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
						v-else
						:id="getPanelId('events')"
						:aria-labelledby="getTabId('events')"
						role="tabpanel"
					>
						<HowToPlayEventsTab />
					</section>
				</div>
			</section>
		</div>
	</Teleport>
</template>
