import { Router } from 'express';

import { handleStartGameSession, handleFinishGameSession } from '../controllers/gameSessions.js';
import { handleGetLeaderboard, handleGetMyRank } from '../controllers/leaderboard.js';

const router = Router();

router.post('/games/start', handleStartGameSession);
router.post('/games/finish', handleFinishGameSession);
router.get('/scores/leaderboard', handleGetLeaderboard);
router.get('/scores/leaderboard/me', handleGetMyRank);

export default router;
