import { getWeekStart } from '../lib/utils/weekStart';
import { prisma } from './prisma';

export async function cleanupOldScores(): Promise<number> {
	const currentWeekStart = getWeekStart();
	const result = await prisma.score.deleteMany({
		where: {
			weekStart: {
				lt: currentWeekStart
			}
		}
	});
	return result.count;
}

export function scheduleWeeklyCleanup(): void {
	const now = new Date();
	const nextMonday = new Date(now);
	const day = now.getDay();
	const diffToNextMonday = day === 0 ? 1 : 8 - day;
	nextMonday.setDate(now.getDate() + diffToNextMonday);
	nextMonday.setHours(0, 0, 0, 0);

	const msUntilMonday = nextMonday.getTime() - now.getTime();

	setTimeout(() => {
		cleanupOldScores().catch(console.error);
		scheduleWeeklyCleanup();
	}, msUntilMonday);
}
