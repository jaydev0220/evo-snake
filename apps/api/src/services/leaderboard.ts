import type { LeaderboardEntry, PlayerRank, SubmitScoreBody } from '@packages/types';

import { getWeekStart } from '../lib/utils/weekStart';
import { prisma } from './prisma';

const LEADERBOARD_LIMIT = 20;

export async function submitScore(input: SubmitScoreBody): Promise<void> {
	const weekStart = getWeekStart();
	await prisma.score.create({
		data: {
			playerId: input.playerId,
			score: input.score,
			difficulty: input.difficulty,
			weekStart
		}
	});
}

export async function getLeaderboard(
	difficulty: string
): Promise<{ data: LeaderboardEntry[]; totalEntries: number }> {
	const weekStart = getWeekStart();

	const rawScores = await prisma.score.groupBy({
		by: ['playerId'],
		where: {
			difficulty,
			weekStart
		},
		_max: {
			score: true
		},
		_min: {
			createdAt: true
		},
		orderBy: {
			_max: {
				score: 'desc'
			}
		},
		take: LEADERBOARD_LIMIT
	});

	const data: LeaderboardEntry[] = rawScores.map((entry, index) => ({
		rank: index + 1,
		playerId: entry.playerId,
		score: entry._max.score ?? 0,
		difficulty,
		createdAt: entry._min.createdAt!.toISOString()
	}));

	const totalEntries = await prisma.score.count({
		where: {
			difficulty,
			weekStart
		}
	});

	return { data, totalEntries };
}

export async function getPlayerRank(
	playerId: string,
	difficulty: string
): Promise<PlayerRank | null> {
	const weekStart = getWeekStart();

	const playerBest = await prisma.score.groupBy({
		by: ['playerId'],
		where: {
			playerId,
			difficulty,
			weekStart
		},
		_max: {
			score: true
		}
	});

	if (playerBest.length === 0) {
		return null;
	}

	const playerScore = playerBest[0]._max.score ?? 0;

	const higherCount = await prisma.score.groupBy({
		by: ['playerId'],
		where: {
			difficulty,
			weekStart
		},
		_max: {
			score: true
		}
	});

	let rank = 1;
	for (const entry of higherCount) {
		if ((entry._max.score ?? 0) > playerScore) {
			rank++;
		}
	}

	return {
		rank,
		playerId,
		score: playerScore,
		difficulty
	};
}
