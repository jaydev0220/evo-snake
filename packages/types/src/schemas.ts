import * as z from 'zod';

export const difficultyEnum = z.enum(['easy', 'normal', 'hard', 'asian']);

export const submitScoreSchema = z.object({
	playerId: z.uuid(),
	playerName: z.string().min(1).max(20),
	score: z.int().min(0),
	difficulty: difficultyEnum,
});

export const leaderboardQuerySchema = z.object({
	difficulty: difficultyEnum,
});

export const meQuerySchema = z.object({
	playerId: z.uuid(),
	difficulty: difficultyEnum,
});

export const envSchema = z.object({
	NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
	PORT: z.coerce.number().int().min(0).max(65535).default(3000),
	DATABASE_URL: z.string().min(1),
	CORS_ORIGIN: z.url().default('http://localhost:5173'),
});
