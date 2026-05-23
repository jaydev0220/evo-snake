import {
	APPLE_SPAWN_WEIGHTS,
	MAX_SPECIAL_APPLES,
	ROTTEN_APPLE_LIFETIME_MS,
	type Apple,
	type AppleType,
	type Position,
	type SpawnableAppleType
} from '../data';

export interface BuildAppleOptions {
	id: string;
	type: AppleType;
	position: Position;
	specialAppleLifetimeMs: number;
	now?: number;
}

export interface RandomEmptyCellOptions {
	snakeBody: Position[];
	apples: Apple[];
	mapWidth: number;
	mapHeight: number;
}

export interface SpawnAppleOptions extends RandomEmptyCellOptions {
	createId: () => string;
	specialAppleLifetimeMs: number;
	forcedType?: SpawnableAppleType | null;
}

export function isSpecialAppleType(
	type: AppleType
): type is Exclude<AppleType, 'classic' | 'rotten'> {
	return type !== 'classic' && type !== 'rotten';
}

export function getRandomWeightedType(
	pool: SpawnableAppleType[] = Object.keys(APPLE_SPAWN_WEIGHTS) as SpawnableAppleType[]
) {
	const totalWeight = pool.reduce((sum, type) => sum + APPLE_SPAWN_WEIGHTS[type], 0);
	let random = Math.random() * totalWeight;

	for (const type of pool) {
		random -= APPLE_SPAWN_WEIGHTS[type];
		if (random <= 0) {
			return type;
		}
	}

	return pool[0] ?? 'classic';
}

export function getRandomEmptyCell({
	snakeBody,
	apples,
	mapWidth,
	mapHeight
}: RandomEmptyCellOptions): Position | null {
	const occupied = new Set(snakeBody.map((position) => `${position.x},${position.y}`));
	for (const apple of apples) {
		occupied.add(`${apple.position.x},${apple.position.y}`);
	}

	const emptyCells: Position[] = [];
	for (let x = 0; x < mapWidth; x++) {
		for (let y = 0; y < mapHeight; y++) {
			if (!occupied.has(`${x},${y}`)) {
				emptyCells.push({ x, y });
			}
		}
	}

	if (emptyCells.length === 0) return null;
	return emptyCells[Math.floor(Math.random() * emptyCells.length)]!;
}

export function chooseSpawnType(apples: Apple[]): SpawnableAppleType {
	const specialAppleCount = apples.filter((apple) => isSpecialAppleType(apple.type)).length;
	if (specialAppleCount >= MAX_SPECIAL_APPLES) {
		return 'classic';
	}

	return getRandomWeightedType();
}

export function buildApple({
	id,
	type,
	position,
	specialAppleLifetimeMs,
	now = Date.now()
}: BuildAppleOptions): Apple {
	const expiresAt =
		type === 'rotten'
			? now + ROTTEN_APPLE_LIFETIME_MS
			: isSpecialAppleType(type)
				? now + specialAppleLifetimeMs
				: null;

	return {
		id,
		type,
		position,
		spawnedAt: now,
		expiresAt
	};
}

export function canSpawnForcedType(type: SpawnableAppleType, apples: Apple[]) {
	if (!isSpecialAppleType(type)) {
		return true;
	}

	const specialAppleCount = apples.filter((apple) => isSpecialAppleType(apple.type)).length;
	return specialAppleCount < MAX_SPECIAL_APPLES;
}

export function spawnApple({
	snakeBody,
	apples,
	mapWidth,
	mapHeight,
	createId,
	specialAppleLifetimeMs,
	forcedType
}: SpawnAppleOptions): Apple | null {
	const position = getRandomEmptyCell({ snakeBody, apples, mapWidth, mapHeight });
	if (!position) {
		return null;
	}

	const type =
		forcedType && canSpawnForcedType(forcedType, apples) ? forcedType : chooseSpawnType(apples);
	return buildApple({
		id: createId(),
		type,
		position,
		specialAppleLifetimeMs
	});
}

export function removeApple(apples: Apple[], id: string) {
	return apples.filter((apple) => apple.id !== id);
}

export function updateExpiredApples(apples: Apple[], now = Date.now()) {
	let didChange = false;
	const nextApples: Apple[] = [];

	for (const apple of apples) {
		if (!apple.expiresAt || apple.expiresAt > now) {
			nextApples.push(apple);
			continue;
		}

		didChange = true;
		if (isSpecialAppleType(apple.type)) {
			nextApples.push({
				...apple,
				type: 'rotten',
				spawnedAt: now,
				expiresAt: now + ROTTEN_APPLE_LIFETIME_MS
			});
		}
	}

	return {
		apples: nextApples,
		didChange
	};
}
