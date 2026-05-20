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
				class="relative z-10 w-full max-w-md rounded-xl border border-gray-700 bg-gray-900 p-6 shadow-xl"
			>
				<div class="mb-4 flex items-center justify-between">
					<div class="flex items-center gap-2 text-lg font-semibold text-gray-100">
						<BookOpen class="h-5 w-5 text-emerald-500" />
						How to Play
					</div>
					<button
						type="button"
						class="rounded-lg p-1 text-gray-400 hover:text-gray-200"
						@click="close"
					>
						<X class="h-5 w-5" />
					</button>
				</div>
				<div class="space-y-3 text-sm text-gray-300">
					<p>
						<strong class="text-gray-100">Controls:</strong>
						Use arrow keys or WASD to change the snake's direction.
					</p>
					<p>
						<strong class="text-gray-100">Goal:</strong>
						Eat fruits to grow and increase your score. Don't hit the walls or yourself!
					</p>
					<p>
						<strong class="text-gray-100">Fruits:</strong>
						Different fruits give different points and may have special effects.
					</p>
					<p>
						<strong class="text-gray-100">Difficulty:</strong>
						Higher difficulties increase the snake's speed and challenge.
					</p>
					<p>
						<strong class="text-gray-100">Leaderboard:</strong>
						Your best score each week is tracked. Rankings reset weekly (Monday, Taipei time).
					</p>
				</div>
			</div>
		</div>
	</Teleport>
</template>
