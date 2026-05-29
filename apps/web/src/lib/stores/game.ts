import type { Difficulty, LeaderboardEntry, MapId, PlayerRank } from '@packages/types';
import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

import { fetchLeaderboard, fetchMyRank, submitScore } from '../api';

const PLAYER_ID_KEY = 'evosnake_player_id';

function generateUUID(): string {
	return (
		crypto.randomUUID?.() ??
		'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
			const r = (Math.random() * 16) | 0;
			return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
		})
	);
}

function getStoredPlayerId(): string {
	try {
		const storedId = localStorage.getItem(PLAYER_ID_KEY);
		if (storedId) return storedId;

		const newId = generateUUID();
		localStorage.setItem(PLAYER_ID_KEY, newId);
		return newId;
	} catch {
		return generateUUID();
	}
}

export const useGameStore = defineStore('game', () => {
	const playerName = ref('');
	const selectedDifficulty = ref<Difficulty>('normal');
	const selectedMap = ref<MapId>('classic');
	const playerId = ref(getStoredPlayerId());

	const leaderboard = ref<LeaderboardEntry[]>([]);
	const myRank = ref<PlayerRank | null>(null);
	const isLoading = ref(false);
	const error = ref<string | null>(null);

	watch(selectedDifficulty, () => {
		loadLeaderboard();
	});
	watch(selectedMap, () => {
		loadLeaderboard();
	});

	function setPlayerName(name: string) {
		playerName.value = name.trim();
	}

	function setDifficulty(difficulty: Difficulty) {
		selectedDifficulty.value = difficulty;
	}

	function setMap(map: MapId) {
		selectedMap.value = map;
	}

	async function loadLeaderboard() {
		isLoading.value = true;
		error.value = null;
		try {
			const res = await fetchLeaderboard(selectedDifficulty.value, selectedMap.value);
			leaderboard.value = res.data;
			await loadMyRank();
		} catch {
			error.value = 'errors.loadLeaderboardFailed';
		} finally {
			isLoading.value = false;
		}
	}

	async function loadMyRank() {
		if (!playerName.value) return;
		try {
			myRank.value = await fetchMyRank(playerId.value, selectedDifficulty.value, selectedMap.value);
		} catch {
			myRank.value = null;
		}
	}

	async function postScore(score: number, difficulty: Difficulty, map: MapId) {
		const trimmedName = playerName.value.trim();
		if (!trimmedName) {
			error.value = 'errors.playerNameRequired';
			return false;
		}

		try {
			await submitScore({
				playerId: playerId.value,
				playerName: trimmedName,
				score,
				difficulty,
				map
			});
			error.value = null;
			await loadLeaderboard();
			return true;
		} catch {
			error.value = 'errors.submitScoreFailed';
			return false;
		}
	}

	return {
		playerName,
		selectedDifficulty,
		selectedMap,
		playerId,
		leaderboard,
		myRank,
		isLoading,
		error,
		setPlayerName,
		setDifficulty,
		setMap,
		loadLeaderboard,
		loadMyRank,
		postScore
	};
});
