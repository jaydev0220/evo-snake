import { envSchema } from '@packages/types';
import type z from 'zod';

export type Env = z.output<typeof envSchema>;

export const env = envSchema.parse(process.env);

export function validateEnv(): Env {
	return env;
}
