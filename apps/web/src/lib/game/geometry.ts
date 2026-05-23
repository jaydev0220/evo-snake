import type { Direction, Position } from '../data';

export function clamp(value: number, min: number, max: number) {
	return Math.min(Math.max(value, min), max);
}

export function directionToVector(direction: Direction): Position {
	switch (direction) {
		case 'up':
			return { x: 0, y: -1 };
		case 'down':
			return { x: 0, y: 1 };
		case 'left':
			return { x: -1, y: 0 };
		case 'right':
			return { x: 1, y: 0 };
	}
}

export function areOpposite(a: Position, b: Position) {
	return a.x === -b.x && a.y === -b.y;
}

export function isSamePosition(a: Position, b: Position) {
	return a.x === b.x && a.y === b.y;
}

export function getNextPosition(position: Position, direction: Direction): Position {
	const vector = directionToVector(direction);
	return {
		x: position.x + vector.x,
		y: position.y + vector.y
	};
}

export function isOutsideBounds(position: Position, mapWidth: number, mapHeight: number) {
	return position.x < 0 || position.x >= mapWidth || position.y < 0 || position.y >= mapHeight;
}

export function collidesWithSnakeBody(
	position: Position,
	snakeBody: Position[],
	targetLength: number,
	canPassThroughBody: boolean
) {
	if (canPassThroughBody) {
		return false;
	}

	const willMoveTail = snakeBody.length >= targetLength;
	const collisionBody = willMoveTail ? snakeBody.slice(0, -1) : snakeBody;
	return collisionBody.some((segment) => isSamePosition(segment, position));
}
