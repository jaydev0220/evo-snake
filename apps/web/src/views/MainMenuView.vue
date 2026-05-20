<script setup lang="ts">
	import { Play, CircleHelp, Bug } from '@lucide/vue';
	import { ref, onMounted } from 'vue';

	import DifficultySelector from '../components/DifficultySelector.vue';
	import HowToPlayModal from '../components/HowToPlayModal.vue';
	import LeaderboardPanel from '../components/LeaderboardPanel.vue';
	import { useGameStore } from '../lib/stores/game';

	const store = useGameStore();
	const showHowToPlay = ref(false);

	const emit = defineEmits<{
		start: [];
	}>();

	function openBugReport() {
		window.open('https://github.com/anomalyco/opencode/issues', '_blank');
	}

	function handlePlay() {
		if (!store.playerName.trim()) return;
		store.loadLeaderboard();
		emit('start');
	}

	onMounted(() => {
		store.loadLeaderboard();
	});
</script>

<template>
	<main
		class="bg-evosnake-bg text-evosnake-text grid min-h-screen place-items-center px-4 py-5 md:px-6"
	>
		<section
			class="grid w-full max-w-[960px] gap-4 md:gap-5 lg:grid-cols-[minmax(0,1fr)_340px]"
			aria-label="EvoSnake main menu"
		>
			<div
				class="bg-evosnake-surface border-evosnake-border rounded-evosnakePanel shadow-evosnakePanel grid content-center gap-7 border p-5 md:p-8 lg:min-h-[520px]"
			>
				<h1
					class="flex items-center justify-center gap-2 text-[clamp(42px,14vw,64px)] leading-none font-black tracking-[-0.06em] md:justify-start md:gap-4 md:text-[clamp(48px,8vw,84px)]"
				>
					<span
						aria-hidden="true"
						class="text-[0.72em] tracking-normal"
					>
						🐍
					</span>
					<span>EvoSnake</span>
				</h1>

				<div class="grid gap-7">
					<label class="grid gap-2">
						<span class="text-evosnake-muted text-xs font-bold tracking-wide uppercase">
							Player name
						</span>
						<input
							v-model="store.playerName"
							type="text"
							maxlength="20"
							class="rounded-evosnake border-evosnake-border bg-evosnake-surface2 text-evosnake-text focus:border-evosnake-primary focus:ring-evosnake-primary/20 min-h-12 border px-3.5 text-base outline-none focus:ring-4"
						/>
					</label>

					<DifficultySelector v-model="store.selectedDifficulty" />

					<div class="grid grid-cols-1 gap-2.5 md:grid-cols-3">
						<button
							type="button"
							:disabled="!store.playerName.trim()"
							class="rounded-evosnake bg-evosnake-primary hover:bg-evosnake-primaryHover min-h-[50px] px-4 text-sm font-extrabold text-[#08100b] disabled:cursor-not-allowed disabled:opacity-40"
							@click="handlePlay"
						>
							<span class="inline-flex w-full items-center justify-center gap-2">
								<Play
									class="h-4 w-4"
									aria-hidden="true"
								/>
								<span>Play</span>
							</span>
						</button>

						<button
							type="button"
							class="rounded-evosnake border-evosnake-border bg-evosnake-surface2 text-evosnake-text hover:border-evosnake-primary min-h-[50px] border px-4 text-sm font-extrabold"
							@click="showHowToPlay = true"
						>
							<span class="inline-flex w-full items-center justify-center gap-2">
								<CircleHelp
									class="h-4 w-4"
									aria-hidden="true"
								/>
								<span>How to Play</span>
							</span>
						</button>

						<button
							type="button"
							class="rounded-evosnake border-evosnake-danger hover:border-evosnake-dangerHover hover:bg-evosnake-danger/10 min-h-[50px] border bg-transparent px-4 text-sm font-extrabold text-red-100"
							@click="openBugReport"
						>
							<span class="inline-flex w-full items-center justify-center gap-2">
								<Bug
									class="h-4 w-4"
									aria-hidden="true"
								/>
								<span>Report Bug</span>
							</span>
						</button>
					</div>
				</div>
			</div>

			<LeaderboardPanel />
		</section>

		<HowToPlayModal v-model="showHowToPlay" />
	</main>
</template>
