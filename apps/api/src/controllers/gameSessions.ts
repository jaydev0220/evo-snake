import type { Request, Response } from 'express';

import { finishGameSessionSchema, startGameSessionSchema } from '../lib/schemas/leaderboard.js';
import { finishGameSession, startGameSession } from '../services/gameSessions.js';

function validationErrorResponse(result: {
	error: { issues: Array<{ path: PropertyKey[]; code: string; message: string }> };
}) {
	return {
		error: {
			code: 'VALIDATION_FAILED',
			message: 'Request validation failed',
			details: result.error.issues.map((issue) => ({
				field: issue.path.join('.'),
				code: issue.code,
				message: issue.message
			}))
		}
	};
}

export async function handleStartGameSession(req: Request, res: Response): Promise<void> {
	const result = startGameSessionSchema.safeParse(req.body);
	if (!result.success) {
		res.status(400).json(validationErrorResponse(result));
		return;
	}

	const session = await startGameSession(result.data);
	res.status(201).json(session);
}

export async function handleFinishGameSession(req: Request, res: Response): Promise<void> {
	const result = finishGameSessionSchema.safeParse(req.body);
	if (!result.success) {
		res.status(400).json(validationErrorResponse(result));
		return;
	}

	await finishGameSession(result.data);
	res.status(201).end();
}
