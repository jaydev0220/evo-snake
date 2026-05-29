import type { z } from 'zod';

import {
	difficultyEnum,
	mapEnum,
	submitScoreSchema,
	leaderboardQuerySchema,
	meQuerySchema
} from './schemas.js';

export type Difficulty = z.infer<typeof difficultyEnum>;
export type MapId = z.infer<typeof mapEnum>;

export type SubmitScoreBody = z.infer<typeof submitScoreSchema>;

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
	mapEnum,
	submitScoreSchema,
	leaderboardQuerySchema,
	meQuerySchema,
	envSchema
} from './schemas.js';
