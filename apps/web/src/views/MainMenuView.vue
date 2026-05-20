<script setup lang="ts">
	import { User, Play, Bug, BookOpen } from '@lucide/vue';
	import { ref, onMounted } from 'vue';

	import DifficultySelector from '../components/DifficultySelector.vue';
	import HowToPlayModal from '../components/HowToPlayModal.vue';
	import LeaderboardPanel from '../components/LeaderboardPanel.vue';
	import { useGameStore } from '../lib/stores/game';

	const store = useGameStore();
	const showHowToPlay = ref(false);

	const emit = defineEmits<{
		start: [];
	}>();

	function openBugReport() {
		window.open('https://github.com/anomalyco/opencode/issues', '_blank');
	}

	function handlePlay() {
		if (!store.playerName.trim()) return;
		store.loadLeaderboard();
		emit('start');
	}

	onMounted(() => {
		store.loadLeaderboard();
	});
</script>

<template>
	<div class="flex min-h-screen flex-col items-center justify-center bg-gray-950 px-4 py-8">
		<div class="w-full max-w-md space-y-6">
			<h1 class="text-center text-4xl font-bold tracking-tight text-emerald-400">🐍 EvoSnake</h1>

			<div class="space-y-4">
				<div class="flex items-center gap-2">
					<User class="h-4 w-4 text-gray-400" />
					<input
						v-model="store.playerName"
						type="text"
						placeholder="Enter your name"
						class="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-gray-100 placeholder-gray-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
						maxlength="20"
					/>
				</div>

				<DifficultySelector v-model="store.selectedDifficulty" />

				<button
					type="button"
					:disabled="!store.playerName.trim()"
					class="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
					@click="handlePlay"
				>
					<Play class="h-4 w-4" />
					Play
				</button>
			</div>

			<div class="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
				<LeaderboardPanel />
			</div>

			<div class="flex gap-3">
				<button
					type="button"
					class="flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-700 bg-gray-800/50 px-4 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:border-gray-600 hover:text-gray-200"
					@click="showHowToPlay = true"
				>
					<BookOpen class="h-4 w-4" />
					How to Play
				</button>
				<button
					type="button"
					class="flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-700 bg-gray-800/50 px-4 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:border-gray-600 hover:text-gray-200"
					@click="openBugReport"
				>
					<Bug class="h-4 w-4" />
					Report Bug
				</button>
			</div>
		</div>

		<HowToPlayModal v-model="showHowToPlay" />
	</div>
</template>
