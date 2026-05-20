import * as z from 'zod';

export const envSchema = z.object({
	NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
	PORT: z.coerce.number().int().min(0).max(65535).default(3000),
	DATABASE_URL: z.string().min(1),
	CORS_ORIGIN: z.string().url().default('http://localhost:5173')
});

export type Env = z.infer<typeof envSchema>;

export const env = envSchema.parse(process.env);

export function validateEnv(): Env {
	return env;
}
