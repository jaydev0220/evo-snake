import {
	BASE_POINTS,
	CHILL_APPLE_POINTS,
	CHILL_DURATION_MS,
	CHILL_POINTS_DELTA,
	CHILL_SPEED_MULTIPLIER,
	CLASSIC_LENGTH_DELTA,
	EFFECT_LABELS,
	GHOST_DURATION_MS,
	GOLDEN_SCORE_MULTIPLIER,
	MAX_POINTS_MULTIPLIER,
	MIN_POINTS_MULTIPLIER,
	MIN_SNAKE_LENGTH,
	SHRINK_LENGTH_DELTA,
	TURBO_DURATION_MS,
	TURBO_POINTS_DELTA,
	TURBO_SPEED_MULTIPLIER,
	type ActiveEffect,
	type Apple,
	type Position
} from '../data';
import { clamp } from './geometry';

type SpeedEffectType = 'turbo' | 'chill';

export interface ActiveEffectView extends ActiveEffect {
	label: string;
	color: string;
	remaining: number;
}

export interface AppleEffectInput {
	apple: Apple;
	score: number;
	targetLength: number;
	snakeBody: Position[];
	pointsMultiplier: number;
	activeEffects: ActiveEffect[];
	displayMultiplier: number;
	iceAgeActive?: boolean;
	now?: number;
}

export interface AppleEffectResult {
	score: number;
	targetLength: number;
	snakeBody: Position[];
	pointsMultiplier: number;
	activeEffects: ActiveEffect[];
	extraForwardSteps: number;
}

export function getDisplayMultiplier(pointsMultiplier: number, activeEffects: ActiveEffect[]) {
	const turbo = activeEffects.find((effect) => effect.type === 'turbo');
	const chill = activeEffects.find((effect) => effect.type === 'chill');
	let multiplier = pointsMultiplier;
	if (turbo) multiplier += TURBO_POINTS_DELTA;
	if (chill) multiplier += CHILL_POINTS_DELTA;
	return clamp(multiplier, MIN_POINTS_MULTIPLIER, MAX_POINTS_MULTIPLIER);
}

export function getCurrentTickMs(baseTickMs: number, activeEffects: ActiveEffect[]) {
	const turbo = activeEffects.find((effect) => effect.type === 'turbo');
	const chill = activeEffects.find((effect) => effect.type === 'chill');
	if (turbo) return baseTickMs / TURBO_SPEED_MULTIPLIER;
	if (chill) return baseTickMs / CHILL_SPEED_MULTIPLIER;
	return baseTickMs;
}

export function getActiveEffectsList(activeEffects: ActiveEffect[], now = Date.now()) {
	return activeEffects.map((effect): ActiveEffectView => {
		const remaining = Math.max(0, Math.ceil((effect.expiresAt - now) / 1000));
		const info = EFFECT_LABELS[effect.type]!;
		return { ...effect, label: info.label, color: info.color, remaining };
	});
}

export function clearExpiredEffects(
	activeEffects: ActiveEffect[],
	pointsMultiplier: number,
	now = Date.now()
) {
	return {
		activeEffects: activeEffects.filter((effect) => effect.expiresAt > now),
		pointsMultiplier
	};
}

export function applyAppleEffect({
	apple,
	score,
	targetLength,
	snakeBody,
	pointsMultiplier,
	activeEffects,
	displayMultiplier,
	iceAgeActive = false,
	now = Date.now()
}: AppleEffectInput): AppleEffectResult {
	let nextScore = score;
	let nextTargetLength = targetLength;
	let nextSnakeBody = snakeBody;
	const nextPointsMultiplier = pointsMultiplier;
	let nextActiveEffects = activeEffects;
	let extraForwardSteps = 0;

	switch (apple.type) {
		case 'classic':
			nextScore += Math.round(BASE_POINTS * displayMultiplier);
			nextTargetLength += CLASSIC_LENGTH_DELTA;
			break;
		case 'shrink':
			nextTargetLength = Math.max(MIN_SNAKE_LENGTH, nextTargetLength + SHRINK_LENGTH_DELTA);
			nextSnakeBody = nextSnakeBody.slice(0, nextTargetLength);
			break;
		case 'turbo':
			nextScore += Math.round(BASE_POINTS * displayMultiplier);
			nextTargetLength += CLASSIC_LENGTH_DELTA;
			nextActiveEffects = replaceSpeedEffect(nextActiveEffects, 'turbo', TURBO_DURATION_MS, now);
			break;
		case 'chill':
			nextTargetLength += CLASSIC_LENGTH_DELTA;
			if (iceAgeActive) {
				nextScore += CHILL_APPLE_POINTS;
				extraForwardSteps = 1;
			} else {
				nextScore += Math.round(BASE_POINTS * displayMultiplier);
				nextActiveEffects = replaceSpeedEffect(nextActiveEffects, 'chill', CHILL_DURATION_MS, now);
			}
			break;
		case 'ghost':
			nextScore += Math.round(BASE_POINTS * displayMultiplier);
			nextTargetLength += CLASSIC_LENGTH_DELTA;
			nextActiveEffects = refreshGhostEffect(nextActiveEffects, GHOST_DURATION_MS, now);
			break;
		case 'golden':
			nextScore += Math.round(BASE_POINTS * displayMultiplier * GOLDEN_SCORE_MULTIPLIER);
			break;
		case 'rotten':
			nextScore = Math.max(0, nextScore - BASE_POINTS);
			break;
	}

	return {
		score: nextScore,
		targetLength: nextTargetLength,
		snakeBody: nextSnakeBody,
		pointsMultiplier: nextPointsMultiplier,
		activeEffects: nextActiveEffects,
		extraForwardSteps
	};
}

export function applySpeedEffect(
	activeEffects: ActiveEffect[],
	type: SpeedEffectType,
	durationMs: number,
	now = Date.now()
) {
	return replaceSpeedEffect(activeEffects, type, durationMs, now);
}

function replaceSpeedEffect(
	activeEffects: ActiveEffect[],
	type: SpeedEffectType,
	durationMs: number,
	now: number
) {
	return [
		...activeEffects.filter((effect) => effect.type !== 'turbo' && effect.type !== 'chill'),
		createActiveEffect(type, durationMs, now)
	];
}

function refreshGhostEffect(activeEffects: ActiveEffect[], durationMs: number, now: number) {
	const existingGhost = activeEffects.find((effect) => effect.type === 'ghost');
	if (!existingGhost) {
		return [...activeEffects, createActiveEffect('ghost', durationMs, now)];
	}

	return activeEffects.map((effect) =>
		effect.type === 'ghost'
			? {
					...effect,
					durationMs,
					expiresAt: now + durationMs
				}
			: effect
	);
}

function createActiveEffect(type: ActiveEffect['type'], durationMs: number, now: number) {
	return {
		type,
		startedAt: now,
		durationMs,
		expiresAt: now + durationMs
	};
}
