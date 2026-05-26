<script setup lang="ts">
	import { ref } from 'vue';

	import LocaleSwitcher from './components/LocaleSwitcher.vue';
	import GameView from './views/GameView.vue';
	import MainMenuView from './views/MainMenuView.vue';

	const currentView = ref<'menu' | 'game'>('menu');

	function startGame() {
		currentView.value = 'game';
	}

	function backToMenu() {
		currentView.value = 'menu';
	}
</script>

<template>
	<div>
		<div class="pointer-events-none fixed inset-x-0 top-4 z-40 flex justify-end px-4 md:px-6">
			<div class="pointer-events-auto">
				<LocaleSwitcher />
			</div>
		</div>

		<MainMenuView
			v-if="currentView === 'menu'"
			@start="startGame"
		/>
		<GameView
			v-else
			@back="backToMenu"
		/>
	</div>
</template>
