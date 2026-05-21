import { Router } from 'express';

import {
	handlePostScore,
	handleGetLeaderboard,
	handleGetMyRank
} from '../controllers/leaderboard.js';

const router = Router();

router.post('/scores', handlePostScore);
router.get('/scores/leaderboard', handleGetLeaderboard);
router.get('/scores/leaderboard/me', handleGetMyRank);

export default router;
