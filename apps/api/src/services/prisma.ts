import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

import { PrismaClient } from '../generated/prisma/client.js';
import { env } from '../lib/schemas/env.js';

function resolveDatabaseUrl(databaseUrl: string): string {
	if (!databaseUrl.startsWith('file:')) return databaseUrl;

	const sqlitePath = databaseUrl.slice('file:'.length);
	if (sqlitePath.startsWith('/')) return databaseUrl;

	const apiRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
	return `file:${resolve(apiRoot, sqlitePath)}`;
}

const adapter = new PrismaBetterSqlite3({ url: resolveDatabaseUrl(env.DATABASE_URL) });

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (env.NODE_ENV !== 'production') {
	globalForPrisma.prisma = prisma;
}
