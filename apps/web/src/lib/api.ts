import type { Difficulty, LeaderboardEntry, PlayerRank, SubmitScoreBody } from '@packages/types';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
	const res = await fetch(`${BASE_URL}${path}`, {
		headers: { 'Content-Type': 'application/json' },
		...options
	});
	if (!res.ok) {
		const error = await res.json().catch(() => null);
		throw new Error(error?.error?.message || error?.message || `HTTP ${res.status}`);
	}
	if (res.status === 201 || res.status === 204) return undefined as T;
	return res.json();
}

export async function fetchLeaderboard(
	difficulty: Difficulty
): Promise<{ data: LeaderboardEntry[]; meta: { totalEntries: number } }> {
	const query = new URLSearchParams({ difficulty });
	return apiFetch(`/v1/scores/leaderboard?${query}`);
}

export async function fetchMyRank(playerId: string, difficulty: Difficulty): Promise<PlayerRank> {
	const query = new URLSearchParams({ playerId, difficulty });
	return apiFetch(`/v1/scores/leaderboard/me?${query}`);
}

export async function submitScore(data: SubmitScoreBody): Promise<void> {
	return apiFetch('/v1/scores', {
		method: 'POST',
		body: JSON.stringify(data)
	});
}
