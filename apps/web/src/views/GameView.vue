<script setup lang="ts">
	import { ArrowLeft } from '@lucide/vue';

	const emit = defineEmits<{
		back: [];
	}>();
</script>

<template>
	<div class="flex min-h-screen flex-col bg-gray-950">
		<div class="flex items-center gap-2 border-b border-gray-800 px-4 py-3">
			<button
				type="button"
				class="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-gray-400 transition-colors hover:text-gray-200"
				@click="emit('back')"
			>
				<ArrowLeft class="h-4 w-4" />
				Back to Menu
			</button>
		</div>

		<div class="flex flex-1 items-center justify-center text-gray-600">
			<p class="text-sm">Game view — to be implemented</p>
		</div>
	</div>
</template>
