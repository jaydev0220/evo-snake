import type { MapId } from '@packages/types';

import {
	GREEDINESS_GATE_CLOSED_MS,
	GREEDINESS_GATE_OPEN_MS,
	GREEDINESS_GATE_WARNING_MS,
	type Position
} from '../data';
import { isSamePosition } from './geometry';

export type GatePhase = 'closed' | 'open' | 'warning';
export type PortalColor = 'blue' | 'orange';

export interface PortalCell {
	id: string;
	color: PortalColor;
	position: Position;
	pairedPosition: Position;
}

export interface GreedinessGatesLayout {
	chamberCells: Position[];
	gateCells: Position[];
	goldenApplePositions: Position[];
	closedMs: number;
	openMs: number;
	warningMs: number;
	cycleMs: number;
}

export interface GameMapLayout {
	id: MapId;
	wallCells: Position[];
	appleBlockedCells: Position[];
	portals: PortalCell[];
	greedinessGates: GreedinessGatesLayout | null;
}

export function createMapLayout(mapId: MapId, width: number, height: number): GameMapLayout {
	if (mapId === 'portals') {
		return createPortalsLayout(width, height);
	}

	if (mapId === 'greedinessGates') {
		return createGreedinessGatesLayout(width, height);
	}

	return {
		id: 'classic',
		wallCells: [],
		appleBlockedCells: [],
		portals: [],
		greedinessGates: null
	};
}

export function getGreedinessGatePhase(
	layout: GreedinessGatesLayout,
	now: number,
	startedAt: number
) {
	const elapsed = positiveModulo(now - startedAt, layout.cycleMs);
	if (elapsed < layout.closedMs) return 'closed';
	if (elapsed < layout.closedMs + layout.openMs) return 'open';
	return 'warning';
}

export function getCellKey(position: Position) {
	return `${position.x},${position.y}`;
}

export function positionListIncludes(positions: Position[], position: Position) {
	return positions.some((candidate) => isSamePosition(candidate, position));
}

function createPortalsLayout(width: number, height: number): GameMapLayout {
	const upperY = 3;
	const lowerY = height - 4;
	const bluePortal = { x: clampInt(Math.floor(width * 0.28), 4, width - 5), y: upperY };
	const orangePortal = { x: clampInt(Math.floor(width * 0.72), 5, width - 4), y: lowerY };
	const wallCells: Position[] = [];
	const tunnelCells: Position[] = [];

	addHorizontalTunnel(
		wallCells,
		tunnelCells,
		1,
		bluePortal.x + clampInt(Math.floor(width / 4), 3, 5),
		bluePortal.y
	);
	addHorizontalTunnel(
		wallCells,
		tunnelCells,
		orangePortal.x - clampInt(Math.floor(width / 4), 3, 5),
		width - 2,
		orangePortal.y
	);

	const portals: PortalCell[] = [
		{
			id: 'blue',
			color: 'blue',
			position: bluePortal,
			pairedPosition: orangePortal
		},
		{
			id: 'orange',
			color: 'orange',
			position: orangePortal,
			pairedPosition: bluePortal
		}
	];

	return {
		id: 'portals',
		wallCells: uniquePositions(wallCells),
		appleBlockedCells: uniquePositions([...wallCells, ...tunnelCells, bluePortal, orangePortal]),
		portals,
		greedinessGates: null
	};
}

function createGreedinessGatesLayout(width: number, height: number): GameMapLayout {
	void height;

	const chamberLength = clampInt(8, 5, width - 5);
	const chamberStartX = Math.floor((width - chamberLength) / 2);
	const chamberEndX = chamberStartX + chamberLength - 1;
	const chamberStartY = 2;
	const chamberEndY = chamberStartY + 1;
	const gateStartX = Math.floor((chamberStartX + chamberEndX) / 2);
	const gateEndX = gateStartX + 1;
	const gateY = chamberEndY + 1;
	const chamberCells: Position[] = [];
	const gateCells: Position[] = [];
	const wallCells: Position[] = [];

	for (let x = chamberStartX; x <= chamberEndX; x++) {
		chamberCells.push({ x, y: chamberStartY }, { x, y: chamberEndY });
		wallCells.push({ x, y: chamberStartY - 1 });

		if (x < gateStartX || x > gateEndX) {
			wallCells.push({ x, y: gateY });
		}
	}

	wallCells.push(
		{ x: chamberStartX - 1, y: chamberStartY },
		{ x: chamberStartX - 1, y: chamberEndY },
		{ x: chamberEndX + 1, y: chamberStartY },
		{ x: chamberEndX + 1, y: chamberEndY }
	);
	gateCells.push({ x: gateStartX, y: gateY }, { x: gateEndX, y: gateY });

	const greedinessGates: GreedinessGatesLayout = {
		chamberCells,
		gateCells,
		goldenApplePositions: [
			{ x: chamberStartX, y: chamberStartY },
			{ x: chamberEndX, y: chamberEndY }
		],
		closedMs: GREEDINESS_GATE_CLOSED_MS,
		openMs: GREEDINESS_GATE_OPEN_MS,
		warningMs: GREEDINESS_GATE_WARNING_MS,
		cycleMs: GREEDINESS_GATE_CLOSED_MS + GREEDINESS_GATE_OPEN_MS + GREEDINESS_GATE_WARNING_MS
	};

	return {
		id: 'greedinessGates',
		wallCells: uniquePositions(wallCells),
		appleBlockedCells: uniquePositions([...wallCells, ...gateCells, ...chamberCells]),
		portals: [],
		greedinessGates
	};
}

function addHorizontalTunnel(
	wallCells: Position[],
	tunnelCells: Position[],
	startX: number,
	endX: number,
	y: number
) {
	const minX = Math.min(startX, endX);
	const maxX = Math.max(startX, endX);
	for (let x = minX; x <= maxX; x++) {
		tunnelCells.push({ x, y });
		wallCells.push({ x, y: y - 1 }, { x, y: y + 1 });
	}
}

function uniquePositions(positions: Position[]) {
	const seen = new Set<string>();
	const result: Position[] = [];
	for (const position of positions) {
		const key = getCellKey(position);
		if (seen.has(key)) continue;
		seen.add(key);
		result.push(position);
	}
	return result;
}

function clampInt(value: number, min: number, max: number) {
	return Math.max(min, Math.min(max, value));
}

function positiveModulo(value: number, modulo: number) {
	return ((value % modulo) + modulo) % modulo;
}
