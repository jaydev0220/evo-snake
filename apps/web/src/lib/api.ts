import type {
	Difficulty,
	FinishGameSessionBody,
	GameInput,
	LeaderboardEntry,
	MapId,
	PlayerRank,
	StartGameSessionBody
} from '@packages/types';

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
	if (res.status === 204) return undefined as T;
	const body = await res.text();
	if (!body) return undefined as T;
	return JSON.parse(body) as T;
}

export async function fetchLeaderboard(
	difficulty: Difficulty,
	map: MapId
): Promise<{ data: LeaderboardEntry[]; meta: { totalEntries: number } }> {
	const query = new URLSearchParams({ difficulty, map });
	return apiFetch(`/v1/scores/leaderboard?${query}`);
}

export async function fetchMyRank(
	playerId: string,
	difficulty: Difficulty,
	map: MapId
): Promise<PlayerRank> {
	const query = new URLSearchParams({ playerId, difficulty, map });
	return apiFetch(`/v1/scores/leaderboard/me?${query}`);
}

export interface GameSessionResponse {
	sessionId: string;
	seed: number;
	expiresAt: string;
}

export async function startGameSession(data: StartGameSessionBody): Promise<GameSessionResponse> {
	return apiFetch('/v1/games/start', {
		method: 'POST',
		body: JSON.stringify(data)
	});
}

export async function finishGameSession(data: FinishGameSessionBody): Promise<void> {
	return apiFetch('/v1/games/finish', {
		method: 'POST',
		body: JSON.stringify(data)
	});
}

export type { GameInput };
