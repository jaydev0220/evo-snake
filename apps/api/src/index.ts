import 'dotenv/config';
import app from './app';
import { validateEnv } from './lib/schemas/env';
import { scheduleWeeklyCleanup, cleanupOldScores } from './services/cleanup';

const env = validateEnv();

async function main() {
	await cleanupOldScores();
	scheduleWeeklyCleanup();

	app.listen(env.PORT, () => {
		console.log(`Server running on port ${env.PORT}`);
	});
}

main().catch(console.error);
