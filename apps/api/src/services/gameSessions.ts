import { randomInt } from 'node:crypto';

import {
	difficultyEnum,
	finishGameSessionSchema,
	mapEnum,
	replayGame,
	type FinishGameSessionBody,
	type StartGameSessionBody
} from '@packages/types';

import { getWeekStart } from '../lib/utils/weekStart.js';
import { AppError } from '../middlewares/errors.js';
import { prisma } from './prisma.js';

const GAME_SESSION_TTL_MS = 2 * 60 * 60 * 1000;
const MAX_SIGNED_INT = 2_147_483_647;

export async function startGameSession(input: StartGameSessionBody) {
	const now = new Date();
	const session = await prisma.gameSession.create({
		data: {
			playerId: input.playerId,
			playerName: input.playerName,
			difficulty: input.difficulty,
			map: input.map,
			seed: randomInt(1, MAX_SIGNED_INT),
			expiresAt: new Date(now.getTime() + GAME_SESSION_TTL_MS)
		},
		select: {
			id: true,
			seed: true,
			expiresAt: true
		}
	});

	return {
		sessionId: session.id,
		seed: session.seed,
		expiresAt: session.expiresAt.toISOString()
	};
}

export async function finishGameSession(input: FinishGameSessionBody): Promise<void> {
	const parsedInput = finishGameSessionSchema.parse(input);
	if (parsedInput.inputs.some((entry) => entry.tick >= parsedInput.tickCount)) {
		throw new AppError(
			'Input log contains entries after the submitted finish tick',
			400,
			'INVALID_RUN'
		);
	}

	const session = await prisma.gameSession.findUnique({
		where: { id: parsedInput.sessionId }
	});
	if (!session) {
		throw new AppError('Game session not found', 404, 'NOT_FOUND');
	}
	if (session.finishedAt) {
		throw new AppError('Game session has already been submitted', 409, 'SESSION_ALREADY_FINISHED');
	}
	if (session.expiresAt.getTime() <= Date.now()) {
		throw new AppError('Game session expired', 410, 'SESSION_EXPIRED');
	}

	const difficulty = difficultyEnum.parse(session.difficulty);
	const map = mapEnum.parse(session.map);
	const replay = replayGame({
		difficulty,
		map,
		seed: session.seed,
		tickCount: parsedInput.tickCount,
		inputs: parsedInput.inputs
	});
	if (!replay.gameOver) {
		throw new AppError('Submitted run does not end in game over', 400, 'INVALID_RUN');
	}

	const weekStart = getWeekStart();
	const finishedAt = new Date();
	await prisma.$transaction(async (tx) => {
		const update = await tx.gameSession.updateMany({
			where: {
				id: session.id,
				finishedAt: null
			},
			data: { finishedAt }
		});
		if (update.count !== 1) {
			throw new AppError(
				'Game session has already been submitted',
				409,
				'SESSION_ALREADY_FINISHED'
			);
		}

		await tx.player.upsert({
			where: { id: session.playerId },
			create: { id: session.playerId, name: session.playerName },
			update: { name: session.playerName }
		});
		await tx.score.create({
			data: {
				playerId: session.playerId,
				score: replay.score,
				difficulty,
				map,
				weekStart
			}
		});
	});
}
