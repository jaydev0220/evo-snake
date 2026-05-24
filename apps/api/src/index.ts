import type { Server } from 'node:http';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { config } from 'dotenv';

interface Disconnectable {
	$disconnect(): Promise<void>;
}

function loadEnv(): void {
	const apiRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
	config({ path: resolve(apiRoot, '.env'), quiet: true });
}

function setupGracefulShutdown(server: Server, prisma: Disconnectable): void {
	let isShuttingDown = false;

	async function shutdown(signal: NodeJS.Signals): Promise<void> {
		if (isShuttingDown) return;
		isShuttingDown = true;

		console.log(`Received ${signal}; shutting down`);
		const finish = async (error?: Error): Promise<void> => {
			const alreadyClosed =
				(error as NodeJS.ErrnoException | undefined)?.code === 'ERR_SERVER_NOT_RUNNING';
			if (error && !alreadyClosed) {
				console.error(error);
			}

			await prisma.$disconnect();
			process.exit(error && !alreadyClosed ? 1 : 0);
		};

		try {
			server.close((error) => {
				void finish(error ?? undefined);
			});
		} catch (error) {
			await finish(error instanceof Error ? error : new Error('Server shutdown failed'));
		}

		setTimeout(() => {
			console.error('Forced shutdown after timeout');
			process.exit(1);
		}, 10_000).unref();
	}

	process.on('SIGTERM', (signal) => {
		void shutdown(signal);
	});
	process.on('SIGINT', (signal) => {
		void shutdown(signal);
	});
}

async function main() {
	loadEnv();
	const [{ default: app }, { validateEnv }, cleanupService, { prisma }] = await Promise.all([
		import('./app.js'),
		import('./lib/schemas/env.js'),
		import('./services/cleanup.js'),
		import('./services/prisma.js')
	]);
	const env = validateEnv();

	try {
		await cleanupService.cleanupOldScores();
	} catch {
		console.warn(
			'Skipping initial cleanup (tables may not exist yet). Run `prisma migrate deploy` to set up the database.'
		);
	}
	cleanupService.scheduleWeeklyCleanup();

	const server = app.listen(env.PORT, () => {
		console.log(`Server running on port ${env.PORT}`);
	});
	setupGracefulShutdown(server, prisma);
}

main().catch((error: unknown) => {
	console.error(error);
	process.exit(1);
});
