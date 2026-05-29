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
	maps: {
		label: '地圖選擇',
		classic: {
			name: '經典',
			description: '沒有特殊規則的乾淨地圖。'
		},
		portals: {
			name: '傳送門',
			description: '一張有傳送門的地圖，傳送門由狹窄的通道連接。進入通道後會穿越到另一側。'
		},
		greedinessGates: {
			name: '貪婪閘門',
			description:
				'一張有狹窄房間的地圖。趁閘門開啟時進入、收集黃金蘋果，並在閘門關閉前逃出。如果閘門夾住你的身體，就必須小心脫困，否則會失去一部分身體。'
		}
	},
	leaderboard: {
		title: '週排行榜',
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
		map: '地圖',
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
		maps: '地圖',
		methodsCount: '{count} 種操作',
		typesCount: '{count} 種類型',
		eventsCount: '{count} 個事件',
		mapsCount: '{count} 張地圖'
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
				effect: '暫時降低蛇的速度與分數倍率，但不給分數。'
			},
			ghost: {
				name: '幽靈蘋果',
				effect: '暫時讓蛇可以穿過自己的身體，但不給分數。'
			},
			golden: {
				name: '黃金蘋果',
				effect: '給予額外分數，且不會讓蛇變長。'
			},
			rotten: {
				name: '腐爛蘋果',
				effect: '特殊蘋果過期後出現，短時間後消失，吃了會扣分。'
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
			description: '依照正確順序吃下 4 顆蘋果可獲得額外分數。吃錯蘋果會結束事件。'
		},
		goldRush: {
			name: '黃金熱潮',
			description: '事件期間只會出現黃金蘋果。黃金蘋果將更快腐爛，腐爛蘋果會存在較長時間。'
		},
		iceAge: {
			name: '冰河時期',
			description:
				'蛇會進入冰緩狀態，移動變慢且分數倍率降低。吃下冰緩蘋果可獲得更多分數，但會讓蛇向前滑行 1 格。'
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
	asianMode: {
		guide: {
			roastLines: [
				'你表哥都蒙眼通關了。你還在這裡讀「玩法說明」。',
				'玩個遊戲也要教學？你表哥七歲就會彈鋼琴、寫程式、報所得稅了。',
				'嗨呀，這都要說明？你表哥用筷子都打通了，還一邊在寫微積分。'
			]
		},
		downgrade: {
			close: '關閉難度審查',
			lines: [
				'你表哥也調低過難度。只是為了照顧遊戲的自尊心。',
				'嗨呀，連你家電鍋都比你會承受壓力。',
				'你祖先撐過饑荒、戰亂、數學作業。你看到蛇變長一點，就說壓力太大。',
				'蛇才長三格，人生突然就太難了？',
				'你的祖先翻山越嶺。你連自己的尾巴都跨過不去。',
				'你的血脈撐過幾百年，就為了看你在方格裡面慌張。'
			]
		},
		grade: {
			lines: {
				F: 'F 就是 Failure。跟你一模一樣。',
				D: '這分數低到連晚餐都沒胃口了。',
				C: '還沒爛到底，但也別以為值得被稱讚。',
				B: '離 A 只差一點，離毀掉晚餐也只差一句解釋。',
				A: '終於達到平均了。你爸媽只會說：「本來就該這樣。」'
			}
		},
		appleFeedback: {
			chill: [
				'連蛇都放慢等你。',
				'蛇變慢，分數變少。反應差的代價。',
				'蛇冷下來了，你爸媽的期待也冷下來了。'
			],
			rotten: [
				'分數沒了，像你爸媽的耐心。',
				'都爛了還吃，難怪成績這樣。',
				'連水果都在教你什麼叫後果。'
			]
		}
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
			'遊玩 EvoSnake，一款免費的瀏覽器貪吃蛇遊戲，結合特殊蘋果、即時事件、可選地圖、難度模式與排行榜競賽。',
		keywords:
			'貪吃蛇遊戲, 瀏覽器遊戲, 街機遊戲, 排行榜遊戲, 地圖, 即時事件, 連鎖獎勵, 黃金熱潮, 冰河時期',
		ogImageAlt: 'EvoSnake 預覽圖，顯示蛇棋盤、蘋果與事件提示。'
	}
} as const;

export default zhTW;
