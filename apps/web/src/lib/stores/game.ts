import type { Difficulty, LeaderboardEntry, PlayerRank } from '@packages/types';
import { defineStore } from 'pinia';
import { ref } from 'vue';

import { fetchLeaderboard, fetchMyRank, submitScore } from '../api';

function generateUUID(): string {
	return (
		crypto.randomUUID?.() ??
		'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
			const r = (Math.random() * 16) | 0;
			return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
		})
	);
}

export const useGameStore = defineStore('game', () => {
	const playerName = ref('');
	const selectedDifficulty = ref<Difficulty>('easy');
	const sessionUUID = ref(localStorage.getItem('evo-snake-session') || generateUUID());

	const leaderboard = ref<LeaderboardEntry[]>([]);
	const myRank = ref<PlayerRank | null>(null);
	const isLoading = ref(false);
	const error = ref<string | null>(null);

	if (!localStorage.getItem('evo-snake-session')) {
		localStorage.setItem('evo-snake-session', sessionUUID.value);
	}

	function setPlayerName(name: string) {
		playerName.value = name;
	}

	function setDifficulty(difficulty: Difficulty) {
		selectedDifficulty.value = difficulty;
	}

	async function loadLeaderboard() {
		isLoading.value = true;
		error.value = null;
		try {
			const res = await fetchLeaderboard(selectedDifficulty.value);
			leaderboard.value = res.data;
			await loadMyRank();
		} catch (e) {
			error.value = e instanceof Error ? e.message : 'Failed to load leaderboard';
		} finally {
			isLoading.value = false;
		}
	}

	async function loadMyRank() {
		if (!playerName.value) return;
		try {
			myRank.value = await fetchMyRank(sessionUUID.value, selectedDifficulty.value);
		} catch {
			myRank.value = null;
		}
	}

	async function postScore(score: number) {
		try {
			await submitScore({
				playerId: sessionUUID.value,
				score,
				difficulty: selectedDifficulty.value
			});
			await loadLeaderboard();
		} catch (e) {
			error.value = e instanceof Error ? e.message : 'Failed to submit score';
		}
	}

	return {
		playerName,
		selectedDifficulty,
		sessionUUID,
		leaderboard,
		myRank,
		isLoading,
		error,
		setPlayerName,
		setDifficulty,
		loadLeaderboard,
		loadMyRank,
		postScore
	};
});
