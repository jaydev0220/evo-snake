import 'dotenv/config';
import app from './app';
import { scheduleWeeklyCleanup, cleanupOldScores } from './services/cleanup';

const PORT = process.env.PORT ?? 3000;

async function main() {
	await cleanupOldScores();
	scheduleWeeklyCleanup();

	app.listen(PORT, () => {
		console.log(`Server running on port ${PORT}`);
	});
}

main().catch(console.error);
