<script setup lang="ts">
	import { computed } from 'vue';
	import { useI18n } from 'vue-i18n';

	import { getAsianScoreGrade, isAsianDifficulty } from '../lib/asian-mode';
	import { useGameStore } from '../lib/stores/game';

	const store = useGameStore();
	const { n, t } = useI18n({ useScope: 'global' });
	const isAsianMode = computed(() => isAsianDifficulty(store.selectedDifficulty));

	function formatScore(score: number) {
		return isAsianMode.value ? getAsianScoreGrade(score) : String(n(score, 'decimal'));
	}
</script>

<template>
	<aside
		class="bg-evosnake-surface border-evosnake-border rounded-evosnakePanel shadow-evosnakePanel border p-5 md:p-6"
	>
		<h2 class="mb-4 text-[22px] font-bold tracking-[-0.03em]">{{ t('leaderboard.title') }}</h2>

		<div
			v-if="store.isLoading"
			class="text-evosnake-muted flex items-center justify-center py-8"
		>
			{{ t('leaderboard.loading') }}
		</div>

		<div
			v-else-if="store.error"
			class="rounded-evosnake border-evosnake-danger bg-evosnake-danger/10 text-evosnake-dangerHover border px-4 py-3 text-sm"
		>
			{{ t(store.error) }}
		</div>

		<div
			v-else-if="store.leaderboard.length === 0"
			class="text-evosnake-muted py-8 text-center text-sm"
		>
			{{ t('leaderboard.empty') }}
		</div>

		<div
			v-else
			class="grid gap-2.5"
		>
			<div
				v-for="entry in store.leaderboard"
				:key="entry.playerId"
				:class="[
					'rounded-evosnake border-evosnake-border bg-evosnake-surface2 grid grid-cols-[34px_1fr_auto] items-center gap-2.5 border p-3',
					entry.playerId === store.playerId ? 'border-evosnake-primary' : ''
				]"
			>
				<div class="text-evosnake-muted font-extrabold">{{ entry.rank }}</div>
				<div class="truncate font-bold">
					{{ entry.playerId === store.playerId ? t('leaderboard.you') : entry.playerName }}
				</div>
				<div class="text-evosnake-primary font-extrabold">{{ formatScore(entry.score) }}</div>
			</div>

			<div
				v-if="store.myRank && !store.leaderboard.some((e) => e.playerId === store.playerId)"
				class="border-evosnake-border mt-2 border-t pt-2"
			>
				<div
					class="rounded-evosnake border-evosnake-primary bg-evosnake-surface2 grid grid-cols-[34px_1fr_auto] items-center gap-2.5 border p-3"
				>
					<div class="text-evosnake-muted font-extrabold">{{ store.myRank.rank }}</div>
					<div class="truncate font-bold">{{ t('leaderboard.you') }}</div>
					<div class="text-evosnake-primary font-extrabold">
						{{ formatScore(store.myRank.score) }}
					</div>
				</div>
			</div>
		</div>
	</aside>
</template>
