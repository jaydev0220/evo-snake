import type { z } from 'zod';

import {
	difficultyEnum,
	submitScoreSchema,
	leaderboardQuerySchema,
	meQuerySchema,
} from './schemas';

export type Difficulty = z.infer<typeof difficultyEnum>;

export type SubmitScoreBody = z.infer<typeof submitScoreSchema>;

export type LeaderboardQuery = z.infer<typeof leaderboardQuerySchema>;

export type MeQuery = z.infer<typeof meQuerySchema>;

export interface LeaderboardEntry {
	rank: number;
	playerId: string;
	score: number;
	difficulty: string;
	createdAt: string;
}

export interface LeaderboardResponse {
	data: LeaderboardEntry[];
	totalEntries: number;
}

export interface PlayerRank {
	rank: number;
	playerId: string;
	score: number;
	difficulty: string;
}

export {
	difficultyEnum,
	submitScoreSchema,
	leaderboardQuerySchema,
	meQuerySchema,
	envSchema,
} from './schemas';
