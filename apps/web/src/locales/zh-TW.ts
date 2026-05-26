const zhTW = {
	app: {
		name: 'EvoSnake'
	},
	locale: {
		switcher: '切換語言',
		zhTWShort: '繁中',
		zhTWLong: '繁體中文',
		enShort: 'EN',
		enLong: 'English'
	},
	menu: {
		ariaLabel: 'EvoSnake 主選單',
		playerName: '玩家名稱',
		play: '開始遊戲',
		howToPlay: '玩法說明',
		reportBug: '回報 Bug'
	},
	difficulty: {
		label: '難度選擇',
		easy: '簡單',
		normal: '普通',
		hard: '困難',
		asian: '亞洲'
	},
	leaderboard: {
		title: '排行榜',
		loading: '載入中...',
		empty: '本週還沒有分數，成為第一位吧。',
		you: '你'
	},
	game: {
		viewAriaLabel: 'EvoSnake 遊戲畫面',
		gameplayArea: '遊戲進行區',
		backToMenu: '返回主選單',
		status: '遊戲狀態',
		score: '分數',
		multiplier: '倍率',
		mode: '模式',
		boardContainer: '遊戲棋盤容器',
		boardArea: '正方形遊戲區',
		eventLive: '事件進行中',
		activeEffects: '生效效果',
		onScreenControls: '螢幕方向鍵',
		moveUp: '向上移動',
		moveDown: '向下移動',
		moveLeft: '向左移動',
		moveRight: '向右移動'
	},
	howToPlay: {
		title: '玩法說明',
		subtitle: '在下一場開始前，先快速了解操作方式、蘋果效果與即時事件。',
		close: '關閉玩法說明',
		sections: '玩法說明分頁',
		controls: '操作',
		apples: '蘋果',
		events: '事件',
		methodsCount: '{count} 種操作',
		typesCount: '{count} 種類型',
		eventsCount: '{count} 個事件'
	},
	controls: {
		wasd: 'WASD',
		arrows: '方向鍵',
		swipe: '滑動',
		wasdAria: 'WASD 移動按鍵',
		arrowsAria: '方向鍵移動按鍵',
		swipeAria: '滑動手勢'
	},
	apples: {
		types: {
			classic: {
				name: '經典蘋果',
				effect: '增加分數，並讓蛇變長。'
			},
			shrink: {
				name: '縮小蘋果',
				effect: '縮短蛇身，但不給分數。'
			},
			turbo: {
				name: '加速蘋果',
				effect: '暫時提高蛇的速度並提升分數倍率，但不給分數。'
			},
			chill: {
				name: '冰緩蘋果',
				effect: '暫時降低蛇的速度與分數倍率，但不給分數。冰河時期中，改為讓蛇額外往前滑行一格。'
			},
			ghost: {
				name: '幽靈蘋果',
				effect: '暫時讓蛇可以穿過自己的身體，但不給分數。'
			},
			golden: {
				name: '黃金蘋果',
				effect: '給予額外分數，但不會讓蛇變長。'
			},
			rotten: {
				name: '腐爛蘋果',
				effect: '特殊蘋果過期後出現，短時間後消失，被吃掉會扣分。'
			}
		}
	},
	effects: {
		turbo: '加速',
		chill: '冰緩',
		ghost: '幽靈'
	},
	events: {
		bonusChain: {
			name: '連鎖獎勵',
			description:
				'稀有的 4 步連鎖序列會出現。依照顯示順序吃下蘋果即可獲得 +80，吃錯任何一顆都會立刻結束。',
			panelTitle: '連鎖獎勵',
			panelInstruction: '依序吃下這些蘋果，吃錯一口就會立刻取消事件。'
		},
		goldRush: {
			name: '黃金熱潮',
			description:
				'10 秒內棋盤只會生成黃金蘋果。黃金蘋果過期得更快，而它們留下的腐爛蘋果會停留更久。'
		},
		iceAge: {
			name: '冰河時期',
			description:
				'立即施加 12 秒的冰緩效果，將現有的加速蘋果轉成冰緩蘋果，並在結束前阻止新的加速蘋果生成。'
		}
	},
	gameOver: {
		title: '遊戲結束',
		close: '關閉遊戲結算',
		finalScore: '最終分數',
		length: '長度',
		uploading: '正在上傳分數...',
		uploaded: '分數已上傳',
		playAgain: '再玩一次',
		mainMenu: '主選單'
	},
	errors: {
		playerNameRequired: '請先輸入玩家名稱。',
		loadLeaderboardFailed: '載入排行榜失敗。',
		submitScoreFailed: '提交分數失敗。',
		uploadScoreFailed: '上傳分數失敗。'
	},
	seo: {
		title: 'EvoSnake | 貪吃蛇遊戲',
		description:
			'遊玩 EvoSnake，一款免費的瀏覽器貪吃蛇遊戲，結合特殊蘋果、即時事件、難度模式與排行榜競賽。',
		keywords:
			'貪吃蛇遊戲, 瀏覽器遊戲, 街機遊戲, 排行榜遊戲, 即時事件, 連鎖獎勵, 黃金熱潮, 冰河時期',
		ogImageAlt: 'EvoSnake 預覽圖，顯示蛇棋盤、蘋果與事件提示。'
	}
} as const;

export default zhTW;
