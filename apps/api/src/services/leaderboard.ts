import type { Difficulty, LeaderboardEntry, MapId, PlayerRank } from '@packages/types';

import { getWeekStart } from '../lib/utils/weekStart.js';
import { prisma } from './prisma.js';

const LEADERBOARD_LIMIT = 20;

async function getTopWeeklyPlayerBestScores(difficulty: Difficulty, map: MapId) {
	const weekStart = getWeekStart();
	return prisma.score.groupBy({
		by: ['playerId'],
		where: {
			difficulty,
			map,
			weekStart
		},
		_max: {
			score: true
		},
		orderBy: [{ _max: { score: 'desc' } }, { playerId: 'asc' }],
		take: LEADERBOARD_LIMIT
	});
}

async function countWeeklyPlayers(difficulty: Difficulty, map: MapId) {
	const weekStart = getWeekStart();
	const rows = await prisma.$queryRaw<Array<{ count: bigint }>>`
		SELECT COUNT(DISTINCT "playerId")::bigint AS count
		FROM "Score"
		WHERE "difficulty" = ${difficulty}
			AND "map" = ${map}
			AND "weekStart" = ${weekStart}
	`;
	return Number(rows[0]?.count ?? 0);
}

export async function getLeaderboard(
	difficulty: Difficulty,
	map: MapId
): Promise<{ data: LeaderboardEntry[]; totalEntries: number }> {
	const weekStart = getWeekStart();
	const [topScores, totalEntries] = await Promise.all([
		getTopWeeklyPlayerBestScores(difficulty, map),
		countWeeklyPlayers(difficulty, map)
	]);

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
					map,
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
		map,
		createdAt: (bestScoreDates[index]?.createdAt ?? weekStart).toISOString()
	}));

	return { data, totalEntries };
}

export async function getPlayerRank(
	playerId: string,
	difficulty: Difficulty,
	map: MapId
): Promise<PlayerRank | null> {
	const weekStart = getWeekStart();
	const playerBest = await prisma.score.aggregate({
		where: {
			playerId,
			difficulty,
			map,
			weekStart
		},
		_max: {
			score: true
		}
	});
	const playerScore = playerBest._max.score;
	if (playerScore === null) {
		return null;
	}

	const rows = await prisma.$queryRaw<Array<{ count: bigint }>>`
		SELECT COUNT(*)::bigint AS count
		FROM (
			SELECT "playerId"
			FROM "Score"
			WHERE "difficulty" = ${difficulty}
				AND "map" = ${map}
				AND "weekStart" = ${weekStart}
			GROUP BY "playerId"
			HAVING MAX("score") > ${playerScore}
		) ranked
	`;
	const rank = Number(rows[0]?.count ?? 0) + 1;

	const player = await prisma.player.findUnique({
		where: { id: playerId },
		select: { name: true }
	});

	return {
		rank,
		playerId,
		playerName: player?.name ?? 'Unknown',
		score: playerScore,
		difficulty,
		map
	};
}
