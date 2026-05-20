<script setup lang="ts">
	import { BookOpen, X } from '@lucide/vue';

	const isOpen = defineModel<boolean>({ required: true });

	function close() {
		isOpen.value = false;
	}

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') close();
	}
</script>

<template>
	<Teleport to="body">
		<div
			v-if="isOpen"
			class="fixed inset-0 z-50 flex items-center justify-center"
			@keydown="onKeydown"
		>
			<div
				class="absolute inset-0 bg-black/60"
				@click="close"
			/>
			<div
				class="rounded-evosnakePanel border-evosnake-border bg-evosnake-surface shadow-evosnakePanel relative z-10 w-full max-w-md border p-6"
			>
				<div class="mb-4 flex items-center justify-between">
					<div class="text-evosnake-text flex items-center gap-2 text-lg font-semibold">
						<BookOpen
							class="text-evosnake-primary h-5 w-5"
							aria-hidden="true"
						/>
						How to Play
					</div>
					<button
						type="button"
						class="text-evosnake-muted hover:text-evosnake-text rounded-lg p-1"
						@click="close"
					>
						<X
							class="h-5 w-5"
							aria-hidden="true"
						/>
					</button>
				</div>
				<div class="text-evosnake-muted space-y-3 text-sm">
					<p>
						<strong class="text-evosnake-text">Controls:</strong>
						Use arrow keys or WASD to change the snake's direction.
					</p>
					<p>
						<strong class="text-evosnake-text">Goal:</strong>
						Eat fruits to grow and increase your score. Don't hit the walls or yourself!
					</p>
					<p>
						<strong class="text-evosnake-text">Fruits:</strong>
						Different fruits give different points and may have special effects.
					</p>
					<p>
						<strong class="text-evosnake-text">Difficulty:</strong>
						Higher difficulties increase the snake's speed and challenge.
					</p>
					<p>
						<strong class="text-evosnake-text">Leaderboard:</strong>
						Your best score each week is tracked. Rankings reset weekly (Monday, Taipei time).
					</p>
				</div>
			</div>
		</div>
	</Teleport>
</template>
