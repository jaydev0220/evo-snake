import * as z from 'zod';

export const difficultyEnum = z.enum(['easy', 'normal', 'hard', 'asian']);
export const mapEnum = z.enum(['classic', 'portals', 'greedinessGates']);

export const submitScoreSchema = z.object({
	playerId: z.uuid(),
	playerName: z.string().min(1).max(20),
	score: z.int().min(0),
	difficulty: difficultyEnum,
	map: mapEnum.default('classic')
});

export const leaderboardQuerySchema = z.object({
	difficulty: difficultyEnum,
	map: mapEnum.default('classic')
});

export const meQuerySchema = z.object({
	playerId: z.uuid(),
	difficulty: difficultyEnum,
	map: mapEnum.default('classic')
});

export const envSchema = z.object({
	NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
	PORT: z.coerce.number().int().min(0).max(65535).prefault(3000),
	DATABASE_URL: z.string().min(1),
	CORS_ORIGIN: z.url().default('http://localhost:5173'),
	JSON_BODY_LIMIT: z.string().min(1).default('10kb'),
	RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().prefault(60_000),
	RATE_LIMIT_MAX: z.coerce.number().int().positive().prefault(120),
	TRUST_PROXY: z
		.enum(['true', 'false'])
		.transform((value) => value === 'true')
		.prefault('false')
});
