import { Router } from 'express';

import { prisma } from '../services/prisma.js';

const healthRouter = Router();

healthRouter.get('/liveness', (_req, res) => {
	res.json({ status: 'ok' });
});

healthRouter.get('/readiness', async (_req, res) => {
	await prisma.player.count();
	res.json({ status: 'ready' });
});

export default healthRouter;
