import {
	APPLE_SPAWN_WEIGHTS,
	BONUS_CHAIN_LENGTH,
	BONUS_CHAIN_MAX_DUPLICATE_PER_TYPE,
	type Apple,
	type AppleType,
	type BonusChainState,
	type SpawnableAppleType
} from '../data';
import { buildApple, getRandomWeightedType, isSpecialAppleType } from './apples';

export interface BonusChainStepView {
	type: SpawnableAppleType;
	index: number;
	isCompleted: boolean;
	isCurrent: boolean;
}

export interface AdvanceBonusChainResult {
	chain: BonusChainState | null;
	completed: boolean;
	failed: boolean;
}

export interface EnsureBonusChainTargetOptions {
	chain: BonusChainState | null;
	apples: Apple[];
	createId: () => string;
	specialAppleLifetimeMs: number;
	now?: number;
}

export function getCurrentBonusChainTarget(chain: BonusChainState | null) {
	if (!chain) return null;
	return chain.steps[chain.currentIndex] ?? null;
}

export function getBonusChainSteps(chain: BonusChainState | null): BonusChainStepView[] {
	if (!chain) return [];
	return chain.steps.map((type, index) => ({
		type,
		index,
		isCompleted: index < chain.currentIndex,
		isCurrent: index === chain.currentIndex
	}));
}

export function createBonusChain(apples: Apple[], now = Date.now()): BonusChainState | null {
	const availableTypes = apples
		.filter((apple) => apple.type !== 'rotten')
		.map((apple) => apple.type as SpawnableAppleType);
	if (availableTypes.length === 0) {
		return null;
	}

	const firstStep = availableTypes[Math.floor(Math.random() * availableTypes.length)];
	if (!firstStep) {
		return null;
	}

	const steps: SpawnableAppleType[] = [firstStep];
	while (steps.length < BONUS_CHAIN_LENGTH) {
		const nextType = getNextBonusChainType(steps);
		if (!nextType) {
			return null;
		}
		steps.push(nextType);
	}

	return {
		steps,
		currentIndex: 0,
		startedAt: now
	};
}

export function advanceBonusChain(
	chain: BonusChainState | null,
	eatenType: AppleType
): AdvanceBonusChainResult {
	const target = getCurrentBonusChainTarget(chain);
	if (!chain || !target) {
		return { chain, completed: false, failed: false };
	}

	if (eatenType !== target) {
		return { chain: null, completed: false, failed: true };
	}

	if (chain.currentIndex >= chain.steps.length - 1) {
		return { chain: null, completed: true, failed: false };
	}

	return {
		chain: {
			...chain,
			currentIndex: chain.currentIndex + 1
		},
		completed: false,
		failed: false
	};
}

export function getPendingBonusChainSpawnType(chain: BonusChainState | null, apples: Apple[]) {
	const target = getCurrentBonusChainTarget(chain);
	if (!target) return null;
	if (apples.some((apple) => apple.type === target)) return null;
	return target;
}

function getNextBonusChainType(steps: SpawnableAppleType[]) {
	const counts = new Map<SpawnableAppleType, number>();
	for (const type of steps) {
		counts.set(type, (counts.get(type) ?? 0) + 1);
	}

	const eligibleTypes = (Object.keys(APPLE_SPAWN_WEIGHTS) as SpawnableAppleType[]).filter(
		(type) => (counts.get(type) ?? 0) < BONUS_CHAIN_MAX_DUPLICATE_PER_TYPE
	);
	if (eligibleTypes.length === 0) {
		return null;
	}

	return getRandomWeightedType(eligibleTypes);
}

export function ensureCurrentBonusChainTargetAvailable({
	chain,
	apples,
	createId,
	specialAppleLifetimeMs,
	now = Date.now()
}: EnsureBonusChainTargetOptions) {
	const target = getCurrentBonusChainTarget(chain);
	if (!target) return apples;
	if (apples.some((apple) => apple.type === target)) return apples;

	const replacementIndex = findBonusChainReplacementIndex(apples, target);
	if (replacementIndex < 0) return apples;

	const replacement = apples[replacementIndex];
	if (!replacement) return apples;

	const nextApple = buildApple({
		id: createId(),
		type: target,
		position: replacement.position,
		specialAppleLifetimeMs,
		now
	});

	return apples.map((apple, index) =>
		index === replacementIndex ? { ...nextApple, id: apple.id } : apple
	);
}

function findBonusChainReplacementIndex(apples: Apple[], target: SpawnableAppleType) {
	const candidateIndexes = apples
		.map((apple, index) => ({ apple, index }))
		.filter(({ apple }) => apple.type !== target && apple.source !== 'greedinessGate');
	if (candidateIndexes.length === 0) {
		return -1;
	}

	const targetIsSpecial = isSpecialAppleType(target);
	candidateIndexes.sort((a, b) => {
		const aPriority = getBonusChainReplacementPriority(a.apple.type, targetIsSpecial);
		const bPriority = getBonusChainReplacementPriority(b.apple.type, targetIsSpecial);
		return aPriority - bPriority;
	});

	return candidateIndexes[0]?.index ?? -1;
}

function getBonusChainReplacementPriority(type: AppleType, targetIsSpecial: boolean) {
	if (targetIsSpecial) {
		if (isSpecialAppleType(type)) return 0;
		if (type === 'rotten') return 1;
		return 2;
	}

	if (type === 'rotten') return 0;
	if (type === 'classic') return 1;
	if (isSpecialAppleType(type)) return 2;
	return 3;
}
