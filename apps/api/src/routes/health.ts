import { Router } from 'express';

import { env } from '../lib/schemas/env.js';
import { prisma } from '../services/prisma.js';

const healthRouter = Router();
let readinessCacheExpiresAt = 0;
let pendingReadinessCheck: Promise<void> | null = null;

async function ensureReadiness() {
	if (Date.now() < readinessCacheExpiresAt) {
		return;
	}

	if (!pendingReadinessCheck) {
		pendingReadinessCheck = prisma.player
			.count()
			.then(() => {
				readinessCacheExpiresAt = Date.now() + env.HEALTH_READINESS_CACHE_MS;
			})
			.finally(() => {
				pendingReadinessCheck = null;
			});
	}

	await pendingReadinessCheck;
}

healthRouter.get('/liveness', (_req, res) => {
	res.json({ status: 'ok' });
});

healthRouter.get('/readiness', async (_req, res) => {
	await ensureReadiness();
	res.json({ status: 'ready' });
});

export default healthRouter;
