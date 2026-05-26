import { type GameEventType } from './data';

export type GuideTab = 'controls' | 'apples' | 'events';

export interface ControlGuideCard {
	id: 'wasd' | 'arrows' | 'swipe';
	type: 'keys' | 'swipe';
}

export interface EventGuideItem {
	id: GameEventType;
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
