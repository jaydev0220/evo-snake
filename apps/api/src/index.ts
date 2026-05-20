import 'dotenv/config';
import app from './app';
import { validateEnv } from './lib/schemas/env';
import { scheduleWeeklyCleanup, cleanupOldScores } from './services/cleanup';

const env = validateEnv();

async function main() {
	try {
		await cleanupOldScores();
	} catch {
		console.warn(
			'Skipping initial cleanup (tables may not exist yet). Run `prisma db push` to set up the database.'
		);
	}
	scheduleWeeklyCleanup();

	app.listen(env.PORT, () => {
		console.log(`Server running on port ${env.PORT}`);
	});
}

main().catch(console.error);
