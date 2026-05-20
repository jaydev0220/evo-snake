export type Difficulty = 'easy' | 'normal' | 'hard' | 'asian';

export interface SubmitScoreBody {
	playerId: string;
	score: number;
	difficulty: Difficulty;
}

export interface LeaderboardQuery {
	difficulty: Difficulty;
}

export interface MeQuery {
	playerId: string;
	difficulty: Difficulty;
}

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
