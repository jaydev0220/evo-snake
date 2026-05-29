import { Router } from 'express';

import { prisma } from '../services/prisma.js';

const healthRouter = Router();
const READINESS_CACHE_MS = 5000;
let readinessCacheExpiresAt = 0;

healthRouter.get('/liveness', (_req, res) => {
	res.json({ status: 'ok' });
});

healthRouter.get('/readiness', async (_req, res) => {
	const now = Date.now();
	if (readinessCacheExpiresAt <= now) {
		await prisma.player.count();
		readinessCacheExpiresAt = now + READINESS_CACHE_MS;
	}
	res.json({ status: 'ready' });
});

export default healthRouter;
