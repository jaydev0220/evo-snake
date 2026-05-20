<script setup lang="ts">
	import { ref } from 'vue';

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
	<MainMenuView
		v-if="currentView === 'menu'"
		@start="startGame"
	/>
	<GameView
		v-else
		@back="backToMenu"
	/>
</template>
