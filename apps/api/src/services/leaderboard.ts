import type { Difficulty, LeaderboardEntry, PlayerRank, SubmitScoreBody } from '@packages/types';

import { getWeekStart } from '../lib/utils/weekStart.js';
import { prisma } from './prisma.js';

const LEADERBOARD_LIMIT = 20;

export async function submitScore(input: SubmitScoreBody): Promise<void> {
	const weekStart = getWeekStart();

	await prisma.$transaction([
		prisma.player.upsert({
			where: { id: input.playerId },
			create: { id: input.playerId, name: input.playerName },
			update: { name: input.playerName }
		}),
		prisma.score.create({
			data: {
				playerId: input.playerId,
				score: input.score,
				difficulty: input.difficulty,
				weekStart
			}
		})
	]);
}

async function getWeeklyPlayerBestScores(difficulty: Difficulty) {
	const weekStart = getWeekStart();
	const scores = await prisma.score.groupBy({
		by: ['playerId'],
		where: {
			difficulty,
			weekStart
		},
		_max: {
			score: true
		}
	});

	return scores.sort((a, b) => {
		const scoreDiff = (b._max.score ?? 0) - (a._max.score ?? 0);
		return scoreDiff || a.playerId.localeCompare(b.playerId);
	});
}

export async function getLeaderboard(
	difficulty: Difficulty
): Promise<{ data: LeaderboardEntry[]; totalEntries: number }> {
	const weekStart = getWeekStart();
	const rawScores = await getWeeklyPlayerBestScores(difficulty);
	const topScores = rawScores.slice(0, LEADERBOARD_LIMIT);

	const playerIds = topScores.map((r) => r.playerId);
	const players = await prisma.player.findMany({
		where: { id: { in: playerIds } },
		select: { id: true, name: true }
	});
	const playerMap = new Map(players.map((p) => [p.id, p.name]));
	const bestScoreDates = await Promise.all(
		topScores.map((entry) =>
			prisma.score.findFirst({
				where: {
					playerId: entry.playerId,
					difficulty,
					weekStart,
					score: entry._max.score ?? 0
				},
				orderBy: { createdAt: 'asc' },
				select: { createdAt: true }
			})
		)
	);

	const data: LeaderboardEntry[] = topScores.map((entry, index) => ({
		rank: index + 1,
		playerId: entry.playerId,
		playerName: playerMap.get(entry.playerId) ?? 'Unknown',
		score: entry._max.score ?? 0,
		difficulty,
		createdAt: (bestScoreDates[index]?.createdAt ?? weekStart).toISOString()
	}));

	return { data, totalEntries: rawScores.length };
}

export async function getPlayerRank(
	playerId: string,
	difficulty: Difficulty
): Promise<PlayerRank | null> {
	const weeklyScores = await getWeeklyPlayerBestScores(difficulty);
	const playerBest = weeklyScores.find((entry) => entry.playerId === playerId);
	if (!playerBest) {
		return null;
	}

	const playerScore = playerBest._max.score ?? 0;
	const rank = weeklyScores.filter((entry) => (entry._max.score ?? 0) > playerScore).length + 1;

	const player = await prisma.player.findUnique({
		where: { id: playerId },
		select: { name: true }
	});

	return {
		rank,
		playerId,
		playerName: player?.name ?? 'Unknown',
		score: playerScore,
		difficulty
	};
}
