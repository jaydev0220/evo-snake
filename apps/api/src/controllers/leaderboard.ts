import type { Request, Response } from 'express';

import {
	submitScoreSchema,
	leaderboardQuerySchema,
	meQuerySchema
} from '../lib/schemas/leaderboard.js';
import { submitScore, getLeaderboard, getPlayerRank } from '../services/leaderboard.js';

export async function handlePostScore(req: Request, res: Response): Promise<void> {
	const result = submitScoreSchema.safeParse(req.body);
	if (!result.success) {
		res.status(400).json({
			error: {
				code: 'VALIDATION_FAILED',
				message: 'Request validation failed',
				details: result.error.issues.map((issue) => ({
					field: issue.path.join('.'),
					code: issue.code,
					message: issue.message
				}))
			}
		});
		return;
	}

	await submitScore(result.data);
	res.status(201).end();
}

export async function handleGetLeaderboard(req: Request, res: Response): Promise<void> {
	const result = leaderboardQuerySchema.safeParse(req.query);
	if (!result.success) {
		res.status(400).json({
			error: {
				code: 'VALIDATION_FAILED',
				message: 'Request validation failed',
				details: result.error.issues.map((issue) => ({
					field: issue.path.join('.'),
					code: issue.code,
					message: issue.message
				}))
			}
		});
		return;
	}

	const { data, totalEntries } = await getLeaderboard(result.data.difficulty);
	res.json({
		data,
		meta: {
			difficulty: result.data.difficulty,
			totalEntries
		}
	});
}

export async function handleGetMyRank(req: Request, res: Response): Promise<void> {
	const result = meQuerySchema.safeParse(req.query);
	if (!result.success) {
		res.status(400).json({
			error: {
				code: 'VALIDATION_FAILED',
				message: 'Request validation failed',
				details: result.error.issues.map((issue) => ({
					field: issue.path.join('.'),
					code: issue.code,
					message: issue.message
				}))
			}
		});
		return;
	}

	const rank = await getPlayerRank(result.data.playerId, result.data.difficulty);
	if (!rank) {
		res.status(404).json({
			error: {
				code: 'NOT_FOUND',
				message: 'No score found for this player in the current week'
			}
		});
		return;
	}

	res.json(rank);
}
