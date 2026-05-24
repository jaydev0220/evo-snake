import {
	BONUS_CHAIN_COMPLETION_BONUS,
	BONUS_CHAIN_LENGTH,
	GOLD_RUSH_DURATION_MS,
	ICE_AGE_DURATION_MS,
	type GameEventType
} from './data';

export type GuideTab = 'controls' | 'apples' | 'events';

export interface ControlGuideCard {
	id: string;
	label: string;
	ariaLabel: string;
	type: 'keys' | 'swipe';
}

export interface EventGuideItem {
	id: GameEventType;
	description: string;
}

export const CONTROL_GUIDE_CARDS: ControlGuideCard[] = [
	{
		id: 'wasd',
		label: 'WASD',
		ariaLabel: 'WASD movement keys',
		type: 'keys'
	},
	{
		id: 'arrows',
		label: 'Arrow Keys',
		ariaLabel: 'Arrow movement keys',
		type: 'keys'
	},
	{
		id: 'swipe',
		label: 'Swipe',
		ariaLabel: 'Swipe gestures',
		type: 'swipe'
	}
];

export const EVENT_GUIDE_ITEMS: EventGuideItem[] = [
	{
		id: 'bonusChain',
		description: `A rare ${BONUS_CHAIN_LENGTH}-step sequence appears. Eat apples in the shown order to claim +${BONUS_CHAIN_COMPLETION_BONUS}, but one wrong apple ends it immediately.`
	},
	{
		id: 'goldRush',
		description: `The board shifts into golden-only spawns for ${GOLD_RUSH_DURATION_MS / 1000} seconds. Golden apples expire much faster, and the rotten apples they leave behind stay around longer.`
	},
	{
		id: 'iceAge',
		description: `Applies Chill for ${ICE_AGE_DURATION_MS / 1000} seconds, converts existing Turbo apples into Chill apples, and prevents new Turbo apples from spawning while the freeze lasts.`
	}
];
