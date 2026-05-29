import type { Difficulty } from '@packages/types';

export type Direction = 'up' | 'down' | 'left' | 'right';
export type AppleType = 'classic' | 'shrink' | 'turbo' | 'chill' | 'ghost' | 'golden' | 'rotten';
export type SpawnableAppleType = Exclude<AppleType, 'rotten'>;
export type GameStatus = 'idle' | 'playing' | 'gameOver';

export interface Position {
	x: number;
	y: number;
}

export interface ActiveEffect {
	type: 'turbo' | 'chill' | 'ghost';
	startedAt: number;
	durationMs: number;
	expiresAt: number;
}

export interface Apple {
	id: string;
	type: AppleType;
	position: Position;
	spawnedAt: number;
	expiresAt: number | null;
	rottenLifetimeMs?: number;
}

export interface DifficultyConfig {
	label: string;
	mapWidth: number;
	mapHeight: number;
	tickMs: number;
	specialAppleLifetimeMs: number;
}

export interface BonusChainState {
	steps: SpawnableAppleType[];
	currentIndex: number;
	startedAt: number;
}

export type GameEventType = 'bonusChain' | 'goldRush' | 'iceAge';

export interface GameEventTheme {
	label: string;
	accent: string;
	glow: string;
	surface: string;
	targetGlow: string;
	targetOutline: string;
}

export const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
	easy: { label: 'Easy', mapWidth: 24, mapHeight: 24, tickMs: 190, specialAppleLifetimeMs: 9000 },
	normal: {
		label: 'Normal',
		mapWidth: 20,
		mapHeight: 20,
		tickMs: 150,
		specialAppleLifetimeMs: 7500
	},
	hard: { label: 'Hard', mapWidth: 16, mapHeight: 16, tickMs: 110, specialAppleLifetimeMs: 6000 },
	asian: { label: 'Asian', mapWidth: 14, mapHeight: 14, tickMs: 80, specialAppleLifetimeMs: 4500 }
};

export const MAX_APPLES_BY_DIFFICULTY: Record<Difficulty, number> = {
	easy: 3,
	normal: 3,
	hard: 2,
	asian: 2
};

export const MAX_SPECIAL_APPLES = 1;
export const ROTTEN_APPLE_LIFETIME_MS = 3000;

export const APPLE_COLORS: Record<AppleType, { fill: string; outline: string }> = {
	classic: { fill: '#E53935', outline: '#9F1D1D' },
	shrink: { fill: '#8E44AD', outline: '#4C1D95' },
	turbo: { fill: '#F97316', outline: '#9A3412' },
	chill: { fill: '#38BDF8', outline: '#0369A1' },
	ghost: { fill: '#E0F2FE', outline: '#7DD3FC' },
	golden: { fill: '#FACC15', outline: '#B45309' },
	rotten: { fill: '#7C5A3C', outline: '#4A3324' }
};

export const APPLE_SPAWN_WEIGHTS: Record<SpawnableAppleType, number> = {
	classic: 60,
	shrink: 10,
	turbo: 10,
	chill: 8,
	ghost: 5,
	golden: 7
};

export const BONUS_CHAIN_LENGTH = 4;
export const BONUS_CHAIN_MAX_DUPLICATE_PER_TYPE = 2;
export const GAME_EVENT_TRIGGER_MIN_MS = 15_000;
export const GAME_EVENT_TRIGGER_MAX_MS = 20_000;
export const GAME_EVENT_TRIGGER_CHANCE = 0.05;
export const GAME_EVENT_TRIGGER_WEIGHTS: Record<GameEventType, number> = {
	bonusChain: 4,
	goldRush: 1,
	iceAge: 4
};
export const GOLD_RUSH_DURATION_MS = 10_000;
export const GOLD_RUSH_SPECIAL_LIFETIME_MULTIPLIER = 0.4;
export const GOLD_RUSH_ROTTEN_LIFETIME_MULTIPLIER = 1.5;
export const ICE_AGE_DURATION_MS = 12_000;

export const GAME_EVENT_THEMES: Record<GameEventType, GameEventTheme> = {
	bonusChain: {
		label: 'Bonus Chain',
		accent: '#F472B6',
		glow: 'rgba(244, 114, 182, 0.46)',
		surface: 'rgba(244, 114, 182, 0.16)',
		targetGlow: 'rgba(244, 114, 182, 0.3)',
		targetOutline: 'rgba(253, 164, 175, 0.96)'
	},
	goldRush: {
		label: 'Gold Rush',
		accent: '#FACC15',
		glow: 'rgba(250, 204, 21, 0.5)',
		surface: 'rgba(250, 204, 21, 0.16)',
		targetGlow: 'rgba(250, 204, 21, 0.34)',
		targetOutline: 'rgba(255, 247, 176, 0.96)'
	},
	iceAge: {
		label: 'Ice Age',
		accent: '#A5F3FC',
		glow: 'rgba(34, 211, 238, 0.46)',
		surface: 'rgba(125, 211, 252, 0.16)',
		targetGlow: 'rgba(165, 243, 252, 0.28)',
		targetOutline: 'rgba(224, 242, 254, 0.96)'
	}
};

export const BASE_POINTS = 20;
export const BONUS_CHAIN_COMPLETION_BONUS = BASE_POINTS * BONUS_CHAIN_LENGTH;
export const MIN_SNAKE_LENGTH = 3;
export const STARTING_SNAKE_LENGTH = 3;
export const MIN_POINTS_MULTIPLIER = 0.25;
export const MAX_POINTS_MULTIPLIER = 3.0;

export const TURBO_DURATION_MS = 5000;
export const TURBO_SPEED_MULTIPLIER = 1.35;
export const TURBO_POINTS_DELTA = 0.5;

export const CHILL_DURATION_MS = 5000;
export const CHILL_SPEED_MULTIPLIER = 0.7;
export const CHILL_POINTS_DELTA = -0.25;

export const GHOST_DURATION_MS = 4500;

export const SHRINK_LENGTH_DELTA = -1;
export const CLASSIC_LENGTH_DELTA = 1;

export const GOLDEN_SCORE_MULTIPLIER = 2;

export const SNAKE_COLORS = {
	normal: '#54d978',
	ghost: 'rgba(84, 217, 120, 0.4)',
	turbo: '#FFB347',
	chill: '#87CEEB'
};

export const GRID_COLOR = 'rgba(242, 247, 243, 0.045)';
export const BOARD_BG = '#1f2a23';
export const GOLDEN_SHINE_COLOR = 'rgba(255, 255, 255, 0.6)';

export interface FruitGuideItem {
	id: AppleType;
}

export const FRUIT_GUIDE: FruitGuideItem[] = [
	{ id: 'classic' },
	{ id: 'shrink' },
	{ id: 'turbo' },
	{ id: 'chill' },
	{ id: 'ghost' },
	{ id: 'golden' },
	{ id: 'rotten' }
];

export const EFFECT_COLORS: Record<ActiveEffect['type'], string> = {
	turbo: '#F97316',
	chill: '#38BDF8',
	ghost: '#E0F2FE'
};
