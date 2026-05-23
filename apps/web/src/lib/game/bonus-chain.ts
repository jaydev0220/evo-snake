import {
	BONUS_CHAIN_LENGTH,
	BONUS_CHAIN_TRIGGER_CHANCE,
	BONUS_CHAIN_TRIGGER_MAX_MS,
	BONUS_CHAIN_TRIGGER_MIN_MS,
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

export function getRandomBonusChainDelay() {
	const range = BONUS_CHAIN_TRIGGER_MAX_MS - BONUS_CHAIN_TRIGGER_MIN_MS;
	return BONUS_CHAIN_TRIGGER_MIN_MS + Math.round(Math.random() * range);
}

export function shouldTriggerBonusChain() {
	return Math.random() <= BONUS_CHAIN_TRIGGER_CHANCE;
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
		steps.push(getRandomWeightedType());
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
		.filter(({ apple }) => apple.type !== target);
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
