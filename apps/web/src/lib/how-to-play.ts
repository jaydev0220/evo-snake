import type { MapId } from '@packages/types';

import { type GameEventType } from './data';

export type GuideTab = 'controls' | 'apples' | 'events' | 'maps';

export interface ControlGuideCard {
	id: 'wasd' | 'arrows' | 'swipe';
	type: 'keys' | 'swipe';
}

export interface EventGuideItem {
	id: GameEventType;
}

export interface MapGuideItem {
	id: MapId;
}

export const CONTROL_GUIDE_CARDS: ControlGuideCard[] = [
	{
		id: 'wasd',
		type: 'keys'
	},
	{
		id: 'arrows',
		type: 'keys'
	},
	{
		id: 'swipe',
		type: 'swipe'
	}
];

export const EVENT_GUIDE_ITEMS: EventGuideItem[] = [
	{ id: 'bonusChain' },
	{ id: 'goldRush' },
	{ id: 'iceAge' }
];

export const MAP_GUIDE_ITEMS: MapGuideItem[] = [
	{ id: 'classic' },
	{ id: 'portals' },
	{ id: 'greedinessGates' }
];
