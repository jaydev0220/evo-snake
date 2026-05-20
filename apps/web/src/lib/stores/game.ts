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
	const playerId = ref(localStorage.getItem('evosnake_player_id') || generateUUID());

	const leaderboard = ref<LeaderboardEntry[]>([]);
	const myRank = ref<PlayerRank | null>(null);
	const isLoading = ref(false);
	const error = ref<string | null>(null);

	if (!localStorage.getItem('evosnake_player_id')) {
		localStorage.setItem('evosnake_player_id', playerId.value);
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
			myRank.value = await fetchMyRank(playerId.value, selectedDifficulty.value);
		} catch {
			myRank.value = null;
		}
	}

	async function postScore(score: number, difficulty: Difficulty) {
		try {
			await submitScore({
				playerId: playerId.value,
				score,
				difficulty
			});
			await loadLeaderboard();
		} catch (e) {
			error.value = e instanceof Error ? e.message : 'Failed to submit score';
		}
	}

	return {
		playerName,
		selectedDifficulty,
		playerId,
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
