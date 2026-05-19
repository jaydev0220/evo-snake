import * as z from 'zod';

export const difficultyEnum = z.enum(['easy', 'normal', 'hard', 'asian']);

export const submitScoreSchema = z.object({
	playerId: z.uuid(),
	score: z.int().min(0),
	difficulty: difficultyEnum
});

export const leaderboardQuerySchema = z.object({
	difficulty: difficultyEnum
});

export const meQuerySchema = z.object({
	playerId: z.uuid(),
	difficulty: difficultyEnum
});
