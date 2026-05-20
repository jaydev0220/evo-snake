export type Direction = 'up' | 'down' | 'left' | 'right';
export type AppleType = 'classic' | 'shrink' | 'turbo' | 'chill' | 'ghost' | 'golden';
export type GameStatus = 'idle' | 'playing' | 'paused' | 'gameOver';

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
	type: AppleType;
	position: Position;
	spawnedAt: number;
	expiresAt: number | null;
}

export interface DifficultyConfig {
	label: string;
	mapWidth: number;
	mapHeight: number;
	tickMs: number;
	specialAppleLifetimeMs: number;
}

export const DIFFICULTIES: Record<string, DifficultyConfig> = {
	easy: { label: 'Easy', mapWidth: 24, mapHeight: 24, tickMs: 160, specialAppleLifetimeMs: 9000 },
	normal: {
		label: 'Normal',
		mapWidth: 20,
		mapHeight: 20,
		tickMs: 120,
		specialAppleLifetimeMs: 7500
	},
	hard: { label: 'Hard', mapWidth: 16, mapHeight: 16, tickMs: 90, specialAppleLifetimeMs: 6000 },
	asian: { label: 'Asian', mapWidth: 14, mapHeight: 14, tickMs: 70, specialAppleLifetimeMs: 4500 }
};

export const APPLE_COLORS: Record<AppleType, { fill: string; outline: string }> = {
	classic: { fill: '#E53935', outline: '#9F1D1D' },
	shrink: { fill: '#8E44AD', outline: '#4C1D95' },
	turbo: { fill: '#F97316', outline: '#9A3412' },
	chill: { fill: '#38BDF8', outline: '#0369A1' },
	ghost: { fill: '#E0F2FE', outline: '#7DD3FC' },
	golden: { fill: '#FACC15', outline: '#B45309' }
};

export const APPLE_SPAWN_WEIGHTS: Record<AppleType, number> = {
	classic: 60,
	shrink: 10,
	turbo: 10,
	chill: 8,
	ghost: 5,
	golden: 7
};

export const BASE_POINTS = 20;
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

export const SHRINK_LENGTH_DELTA = -3;
export const CLASSIC_LENGTH_DELTA = 1;

export const GOLDEN_SCORE_MULTIPLIER = 3;

export const SNAKE_COLORS = {
	normal: '#54d978',
	ghost: 'rgba(84, 217, 120, 0.4)',
	turbo: '#FFB347',
	chill: '#87CEEB'
};

export const GRID_COLOR = 'rgba(242, 247, 243, 0.045)';
export const BOARD_BG = '#1f2a23';
export const GOLDEN_SHINE_COLOR = 'rgba(255, 255, 255, 0.6)';
