import { envSchema } from '@packages/types';

export type Env = typeof envSchema._output;

export const env = envSchema.parse(process.env);

export function validateEnv(): Env {
	return env;
}
