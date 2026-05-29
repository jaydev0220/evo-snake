import type { z } from 'zod';

import {
	difficultyEnum,
	directionEnum,
	mapEnum,
	startGameSessionSchema,
	gameInputSchema,
	finishGameSessionSchema,
	leaderboardQuerySchema,
	meQuerySchema
} from './schemas.js';

export type Difficulty = z.infer<typeof difficultyEnum>;
export type MapId = z.infer<typeof mapEnum>;
export type Direction = z.infer<typeof directionEnum>;

export type StartGameSessionBody = z.infer<typeof startGameSessionSchema>;
export type GameInput = z.infer<typeof gameInputSchema>;
export type FinishGameSessionBody = z.infer<typeof finishGameSessionSchema>;

export type LeaderboardQuery = z.infer<typeof leaderboardQuerySchema>;

export type MeQuery = z.infer<typeof meQuerySchema>;

export interface LeaderboardEntry {
	rank: number;
	playerId: string;
	playerName: string;
	score: number;
	difficulty: string;
	map: string;
	createdAt: string;
}

export interface LeaderboardResponse {
	data: LeaderboardEntry[];
	totalEntries: number;
}

export interface PlayerRank {
	rank: number;
	playerId: string;
	playerName: string;
	score: number;
	difficulty: string;
	map: string;
}

export {
	difficultyEnum,
	directionEnum,
	mapEnum,
	startGameSessionSchema,
	gameInputSchema,
	finishGameSessionSchema,
	leaderboardQuerySchema,
	meQuerySchema,
	envSchema
} from './schemas.js';
export { createSeededRandom, type RandomSource } from './random.js';
export { replayGame, type GameReplayInput, type GameReplayResult } from './game-replay.js';
