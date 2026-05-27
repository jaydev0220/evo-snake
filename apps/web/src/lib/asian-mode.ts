import type { Difficulty } from '@packages/types';

import type { AppleType } from './data';

export type AsianScoreGrade = 'F' | 'D' | 'C' | 'B' | 'A';
export type AsianFeedbackAppleType = Extract<AppleType, 'chill' | 'rotten'>;

export const ASIAN_ROAST_LINE_COUNT = 3;
export const ASIAN_DOWNGRADE_LINE_COUNT = 6;
export const ASIAN_APPLE_FEEDBACK_LINE_COUNT: Record<AsianFeedbackAppleType, number> = {
	chill: 3,
	rotten: 3
};

const ASIAN_GRADE_THRESHOLDS: Array<{ minScore: number; grade: AsianScoreGrade }> = [
	{ minScore: 700, grade: 'A' },
	{ minScore: 450, grade: 'B' },
	{ minScore: 250, grade: 'C' },
	{ minScore: 100, grade: 'D' },
	{ minScore: 0, grade: 'F' }
];

export function isAsianDifficulty(difficulty: Difficulty) {
	return difficulty === 'asian';
}

export function isEasierThanAsian(difficulty: Difficulty) {
	return difficulty !== 'asian';
}

export function getAsianScoreGrade(score: number) {
	return ASIAN_GRADE_THRESHOLDS.find((threshold) => score >= threshold.minScore)?.grade ?? 'F';
}

export function getRandomMessageIndex(count: number) {
	return Math.floor(Math.random() * count);
}
