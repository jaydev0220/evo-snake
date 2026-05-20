<script setup lang="ts">
	import { Trophy, Crown } from '@lucide/vue';

	import { useGameStore } from '../lib/stores/game';

	const store = useGameStore();
</script>

<template>
	<div class="flex flex-col gap-3">
		<div class="flex items-center gap-2 text-sm font-medium text-gray-300">
			<Trophy class="h-4 w-4 text-yellow-500" />
			Leaderboard
		</div>

		<div
			v-if="store.isLoading"
			class="flex items-center justify-center py-8 text-gray-500"
		>
			Loading...
		</div>

		<div
			v-else-if="store.error"
			class="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
		>
			{{ store.error }}
		</div>

		<div
			v-else-if="store.leaderboard.length === 0"
			class="py-8 text-center text-sm text-gray-500"
		>
			No scores yet this week. Be the first!
		</div>

		<div
			v-else
			class="space-y-1"
		>
			<div
				v-for="entry in store.leaderboard"
				:key="entry.playerId"
				:class="[
					'flex items-center gap-3 rounded-lg px-3 py-2 text-sm',
					entry.playerId === store.sessionUUID
						? 'bg-emerald-500/15 text-emerald-400'
						: 'text-gray-300'
				]"
			>
				<span class="w-6 text-center font-mono text-xs text-gray-500">
					{{ entry.rank }}
				</span>
				<div class="flex-1 truncate">
					<div class="flex items-center gap-1">
						<Crown
							v-if="entry.playerId === store.sessionUUID"
							class="h-3 w-3 text-yellow-500"
						/>
						<span class="font-medium">
							{{ entry.playerId === store.sessionUUID ? 'You' : 'Player' }}
						</span>
					</div>
				</div>
				<span class="font-mono font-bold">{{ entry.score }}</span>
			</div>

			<div
				v-if="store.myRank && !store.leaderboard.some((e) => e.playerId === store.sessionUUID)"
				class="mt-2 border-t border-gray-700 pt-2"
			>
				<div
					class="flex items-center gap-3 rounded-lg bg-emerald-500/15 px-3 py-2 text-sm text-emerald-400"
				>
					<span class="w-6 text-center font-mono text-xs text-gray-500">
						{{ store.myRank.rank }}
					</span>
					<div class="flex flex-1 items-center gap-1">
						<Crown class="h-3 w-3 text-yellow-500" />
						<span class="font-medium">You</span>
					</div>
					<span class="font-mono font-bold">{{ store.myRank.score }}</span>
				</div>
			</div>
		</div>
	</div>
</template>
