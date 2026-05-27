const en = {
	app: {
		name: 'EvoSnake'
	},
	locale: {
		switcher: 'Switch language',
		zhTWShort: '繁中',
		zhTWLong: 'Traditional Chinese',
		enShort: 'EN',
		enLong: 'English'
	},
	menu: {
		ariaLabel: 'EvoSnake main menu',
		playerName: 'Player name',
		play: 'Play',
		howToPlay: 'How to Play',
		reportBug: 'Report Bug'
	},
	difficulty: {
		label: 'Difficulty selector',
		easy: 'Easy',
		normal: 'Normal',
		hard: 'Hard',
		asian: 'Asian'
	},
	leaderboard: {
		title: 'Weekly Leaderboard',
		loading: 'Loading...',
		empty: 'No scores yet this week. Be the first!',
		you: 'You'
	},
	game: {
		viewAriaLabel: 'EvoSnake game view',
		gameplayArea: 'Game play area',
		backToMenu: 'Back to Menu',
		status: 'Game status',
		score: 'Score',
		multiplier: 'Multiplier',
		mode: 'Mode',
		boardContainer: 'Game board container',
		boardArea: 'Square game area',
		eventLive: 'Event Live',
		activeEffects: 'Active effects',
		onScreenControls: 'On-screen controls',
		moveUp: 'Move up',
		moveDown: 'Move down',
		moveLeft: 'Move left',
		moveRight: 'Move right'
	},
	howToPlay: {
		title: 'How to Play',
		subtitle: 'Learn the controls, apple effects, and live events before your next run.',
		close: 'Close play guide',
		sections: 'Play guide sections',
		controls: 'Controls',
		apples: 'Apples',
		events: 'Events',
		methodsCount: '{count} methods',
		typesCount: '{count} types',
		eventsCount: '{count} events'
	},
	controls: {
		wasd: 'WASD',
		arrows: 'Arrow Keys',
		swipe: 'Swipe',
		wasdAria: 'WASD movement keys',
		arrowsAria: 'Arrow movement keys',
		swipeAria: 'Swipe gestures'
	},
	apples: {
		types: {
			classic: {
				name: 'Classic Apple',
				effect: 'Increases your score and grows the snake.'
			},
			shrink: {
				name: 'Shrink Apple',
				effect: 'Shortens the snake without giving points.'
			},
			turbo: {
				name: 'Turbo Apple',
				effect:
					"Temporarily increases the snake's speed and raises the score multiplier without giving points."
			},
			chill: {
				name: 'Chill Apple',
				effect:
					'Temporarily slows the snake down and lowers the score multiplier without giving points.'
			},
			ghost: {
				name: 'Ghost Apple',
				effect: 'Temporarily lets the snake pass through its own body without giving points.'
			},
			golden: {
				name: 'Golden Apple',
				effect: "Gives bonus points without increasing the snake's length."
			},
			rotten: {
				name: 'Rotten Apple',
				effect:
					'Appears when a special apple expires, disappears after a short time, and costs points if eaten.'
			}
		}
	},
	effects: {
		turbo: 'Turbo',
		chill: 'Chill',
		ghost: 'Ghost'
	},
	events: {
		bonusChain: {
			name: 'Bonus Chain',
			description:
				'Eat 4 apples in the correct order to earn bonus points. Eating the wrong apple ends the event.'
		},
		goldRush: {
			name: 'Gold Rush',
			description:
				'Only golden apples appear during this event. Golden apples rot faster, and rotten apples stay longer.'
		},
		iceAge: {
			name: 'Ice Age',
			description:
				'The snake is chilled, moving slower with a lower score multiplier. Chill apples give more points, but make the snake slide forward 1 tile.'
		}
	},
	gameOver: {
		title: 'Game Over',
		close: 'Close game over',
		finalScore: 'Final Score',
		length: 'Length',
		uploading: 'Uploading score...',
		uploaded: 'Score uploaded',
		playAgain: 'Play Again',
		mainMenu: 'Main Menu'
	},
	errors: {
		playerNameRequired: 'Player name is required.',
		loadLeaderboardFailed: 'Failed to load leaderboard.',
		submitScoreFailed: 'Failed to submit score.',
		uploadScoreFailed: 'Failed to upload score.'
	},
	seo: {
		title: 'EvoSnake | Browser Snake Game',
		description:
			'Play EvoSnake, a free browser snake game with special apples, live events, difficulty modes, and leaderboard competition straight from your web browser.',
		keywords:
			'snake game, browser snake game, web game, arcade game, leaderboard game, bonus chain, gold rush, ice age',
		ogImageAlt: 'EvoSnake preview artwork showing a snake board, apples, and event callouts.'
	}
} as const;

export default en;
