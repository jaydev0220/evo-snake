import {
	GAME_EVENT_TRIGGER_CHANCE,
	GAME_EVENT_TRIGGER_MAX_MS,
	GAME_EVENT_TRIGGER_MIN_MS,
	GAME_EVENT_TRIGGER_WEIGHTS,
	type GameEventType
} from '../data';

export function getRandomGameEventDelay() {
	const range = GAME_EVENT_TRIGGER_MAX_MS - GAME_EVENT_TRIGGER_MIN_MS;
	return GAME_EVENT_TRIGGER_MIN_MS + Math.round(Math.random() * range);
}

export function shouldTriggerGameEvent() {
	return Math.random() <= GAME_EVENT_TRIGGER_CHANCE;
}

export function pickRandomGameEvent(eventTypes: GameEventType[]) {
	if (eventTypes.length === 0) {
		return null;
	}

	const totalWeight = eventTypes.reduce(
		(sum, eventType) => sum + (GAME_EVENT_TRIGGER_WEIGHTS[eventType] ?? 0),
		0
	);
	if (totalWeight <= 0) {
		return null;
	}

	let random = Math.random() * totalWeight;
	for (const eventType of eventTypes) {
		random -= GAME_EVENT_TRIGGER_WEIGHTS[eventType] ?? 0;
		if (random <= 0) {
			return eventType;
		}
	}

	return eventTypes[0] ?? null;
}
