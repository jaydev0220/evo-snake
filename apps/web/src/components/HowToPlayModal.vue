<script setup lang="ts">
	import { Apple, ArrowDown, ArrowLeft, ArrowRight, ArrowUp, X } from '@lucide/vue';
	import { ref, watch, nextTick } from 'vue';

	import { FRUIT_GUIDE, APPLE_COLORS, BONUS_CHAIN_COMPLETION_BONUS } from '../lib/data';

	const isOpen = defineModel<boolean>({ required: true });

	const modalRef = ref<HTMLElement | null>(null);
	let triggerElement: HTMLElement | null = null;

	function close() {
		isOpen.value = false;
	}

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') close();
	}

	watch(isOpen, async (open) => {
		if (open) {
			triggerElement = document.activeElement as HTMLElement;
			await nextTick();
			modalRef.value?.focus();
		} else if (triggerElement) {
			triggerElement.focus();
		}
	});
</script>

<template>
	<Teleport to="body">
		<div
			v-if="isOpen"
			class="fixed inset-0 z-50 grid place-items-center bg-black/60 px-4 py-5"
			@keydown="onKeydown"
		>
			<section
				ref="modalRef"
				role="dialog"
				aria-modal="true"
				aria-labelledby="play-guide-title"
				tabindex="-1"
				class="rounded-evosnakePanel border-evosnake-border bg-evosnake-surface shadow-evosnakePanel max-h-[calc(100vh-40px)] w-full max-w-170 overflow-hidden border outline-none md:max-h-[calc(100vh-96px)]"
			>
				<header
					class="border-evosnake-border flex items-center justify-between gap-4 border-b px-4 py-4 md:px-5"
				>
					<h2
						id="play-guide-title"
						class="text-evosnake-text text-2xl leading-none font-extrabold tracking-[-0.04em]"
					>
						How to Play
					</h2>

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

				<div
					class="grid max-h-[calc(100vh-120px)] gap-6 overflow-y-auto px-4 py-5 md:max-h-[calc(100vh-176px)] md:px-5"
				>
					<section
						class="grid gap-3"
						aria-labelledby="controls-title"
					>
						<h3
							id="controls-title"
							class="text-evosnake-muted text-xs font-extrabold tracking-wider uppercase"
						>
							Controls
						</h3>

						<div class="grid grid-cols-1 items-center gap-3 md:grid-cols-[1fr_auto_1fr]">
							<div
								class="rounded-evosnake border-evosnake-border bg-evosnake-surface2 border p-4 text-center"
							>
								<div class="text-evosnake-text mb-3 font-extrabold">WASD</div>
								<div
									class="grid justify-center gap-1.5"
									aria-label="WASD movement keys"
								>
									<div class="flex justify-center gap-1.5">
										<kbd
											class="border-evosnake-border bg-evosnake-bg text-evosnake-text grid size-10.5 place-items-center rounded-[10px] border text-sm font-black shadow-inner select-none"
										>
											W
										</kbd>
									</div>
									<div class="flex justify-center gap-1.5">
										<kbd
											class="border-evosnake-border bg-evosnake-bg text-evosnake-text grid size-10.5 place-items-center rounded-[10px] border text-sm font-black shadow-inner select-none"
										>
											A
										</kbd>
										<kbd
											class="border-evosnake-border bg-evosnake-bg text-evosnake-text grid size-10.5 place-items-center rounded-[10px] border text-sm font-black shadow-inner select-none"
										>
											S
										</kbd>
										<kbd
											class="border-evosnake-border bg-evosnake-bg text-evosnake-text grid size-10.5 place-items-center rounded-[10px] border text-sm font-black shadow-inner select-none"
										>
											D
										</kbd>
									</div>
								</div>
							</div>

							<div
								class="text-evosnake-muted text-center text-xs font-black tracking-wider uppercase"
							>
								or
							</div>

							<div
								class="rounded-evosnake border-evosnake-border bg-evosnake-surface2 border p-4 text-center"
							>
								<div class="text-evosnake-text mb-3 font-extrabold">Arrow Keys</div>
								<div
									class="grid justify-center gap-1.5"
									aria-label="Arrow movement keys"
								>
									<div class="flex justify-center gap-1.5">
										<kbd
											class="border-evosnake-border bg-evosnake-bg text-evosnake-text grid size-10.5 place-items-center rounded-[10px] border text-sm font-black shadow-inner"
										>
											<ArrowUp :size="20" />
										</kbd>
									</div>
									<div class="flex justify-center gap-1.5">
										<kbd
											class="border-evosnake-border bg-evosnake-bg text-evosnake-text grid size-10.5 place-items-center rounded-[10px] border text-sm font-black shadow-inner"
										>
											<ArrowLeft :size="20" />
										</kbd>
										<kbd
											class="border-evosnake-border bg-evosnake-bg text-evosnake-text grid size-10.5 place-items-center rounded-[10px] border text-sm font-black shadow-inner"
										>
											<ArrowDown :size="20" />
										</kbd>
										<kbd
											class="border-evosnake-border bg-evosnake-bg text-evosnake-text grid size-10.5 place-items-center rounded-[10px] border text-sm font-black shadow-inner"
										>
											<ArrowRight :size="20" />
										</kbd>
									</div>
								</div>
							</div>
						</div>
					</section>

					<section
						class="grid gap-3"
						aria-labelledby="fruits-title"
					>
						<h3
							id="fruits-title"
							class="text-evosnake-muted text-xs font-extrabold tracking-wider uppercase"
						>
							Fruits
						</h3>

						<div class="grid gap-2.5">
							<div
								v-for="fruit in FRUIT_GUIDE"
								:key="fruit.id"
								class="rounded-evosnake border-evosnake-border bg-evosnake-surface2 grid grid-cols-[40px_1fr] items-start gap-3 border p-3 md:grid-cols-[44px_1fr]"
							>
								<div
									class="bg-evosnake-bg grid size-10 place-items-center rounded-xl text-xl md:size-11 md:text-2xl"
									aria-hidden="true"
								>
									<Apple
										:color="APPLE_COLORS[fruit.id].outline"
										:fill="APPLE_COLORS[fruit.id].fill"
									/>
								</div>

								<div class="min-w-0">
									<div class="text-evosnake-text font-extrabold">
										{{ fruit.name }}
									</div>
									<p class="text-evosnake-muted mt-1 text-sm leading-6">
										{{ fruit.effect }}
									</p>
								</div>
							</div>
						</div>
					</section>

					<section
						class="grid gap-3"
						aria-labelledby="bonus-chain-title"
					>
						<h3
							id="bonus-chain-title"
							class="text-evosnake-muted text-xs font-extrabold tracking-wider uppercase"
						>
							Bonus Chain
						</h3>

						<div
							class="rounded-evosnake border-evosnake-border bg-evosnake-surface2 grid gap-2 border p-3"
						>
							<p class="text-evosnake-text text-sm font-bold">
								Rarely, a 4-step bonus chain appears beside the board.
							</p>
							<p class="text-evosnake-muted text-sm leading-6">
								Eat apples in the shown order to claim +{{ BONUS_CHAIN_COMPLETION_BONUS }}. Eating
								any other apple ends the event immediately.
							</p>
						</div>
					</section>
				</div>
			</section>
		</div>
	</Teleport>
</template>
