<script setup lang="ts">
	import { useGameStore } from '../lib/stores/game';

	const store = useGameStore();
</script>

<template>
	<aside
		class="bg-evosnake-surface border-evosnake-border rounded-evosnakePanel shadow-evosnakePanel border p-5 md:p-6"
	>
		<h2 class="mb-4 text-[22px] font-bold tracking-[-0.03em]">Leaderboard</h2>

		<div
			v-if="store.isLoading"
			class="text-evosnake-muted flex items-center justify-center py-8"
		>
			Loading...
		</div>

		<div
			v-else-if="store.error"
			class="rounded-evosnake border-evosnake-danger bg-evosnake-danger/10 text-evosnake-dangerHover border px-4 py-3 text-sm"
		>
			{{ store.error }}
		</div>

		<div
			v-else-if="store.leaderboard.length === 0"
			class="text-evosnake-muted py-8 text-center text-sm"
		>
			No scores yet this week. Be the first!
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
					{{ entry.playerId === store.playerId ? 'You' : entry.playerName }}
				</div>
				<div class="text-evosnake-primary font-extrabold">{{ entry.score.toLocaleString() }}</div>
			</div>

			<div
				v-if="store.myRank && !store.leaderboard.some((e) => e.playerId === store.playerId)"
				class="border-evosnake-border mt-2 border-t pt-2"
			>
				<div
					class="rounded-evosnake border-evosnake-primary bg-evosnake-surface2 grid grid-cols-[34px_1fr_auto] items-center gap-2.5 border p-3"
				>
					<div class="text-evosnake-muted font-extrabold">{{ store.myRank.rank }}</div>
					<div class="truncate font-bold">You</div>
					<div class="text-evosnake-primary font-extrabold">
						{{ store.myRank.score.toLocaleString() }}
					</div>
				</div>
			</div>
		</div>
	</aside>
</template>
