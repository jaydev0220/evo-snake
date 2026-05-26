<script setup lang="ts">
	import { Trophy, X } from '@lucide/vue';
	import type { Difficulty } from '@packages/types';
	import { useI18n } from 'vue-i18n';

	defineProps<{
		open: boolean;
		score: number;
		mode: Difficulty;
		length: number;
		isUploading: boolean;
		uploadError: string | null;
	}>();

	const emit = defineEmits<{
		close: [];
		playAgain: [];
	}>();

	const { n, t } = useI18n({ useScope: 'global' });
</script>

<template>
	<Teleport to="body">
		<div
			v-if="open"
			class="fixed inset-0 z-50 grid place-items-center bg-black/70 px-4 py-5"
		>
			<section
				role="dialog"
				aria-modal="true"
				aria-labelledby="game-over-title"
				class="rounded-evosnakePanel border-evosnake-border bg-evosnake-surface shadow-evosnakePanel w-full max-w-md border p-6"
			>
				<div class="mb-4 flex items-center justify-between">
					<h2
						id="game-over-title"
						class="text-evosnake-text flex items-center gap-2 text-xl font-extrabold"
					>
						<Trophy
							class="text-evosnake-primary h-6 w-6"
							aria-hidden="true"
						/>
						{{ t('gameOver.title') }}
					</h2>
					<button
						type="button"
						:aria-label="t('gameOver.close')"
						class="text-evosnake-muted hover:text-evosnake-text rounded-lg p-1"
						@click="emit('close')"
					>
						<X
							class="h-5 w-5"
							aria-hidden="true"
						/>
					</button>
				</div>

				<div class="mb-5 grid gap-3">
					<div
						class="rounded-evosnake border-evosnake-border bg-evosnake-surface2 grid gap-1 border px-4 py-3"
					>
						<div class="text-evosnake-muted text-xs font-extrabold tracking-wider uppercase">
							{{ t('gameOver.finalScore') }}
						</div>
						<div class="text-evosnake-text text-2xl font-black">
							{{ n(score, 'decimal') }}
						</div>
					</div>

					<div class="grid grid-cols-2 gap-3">
						<div
							class="rounded-evosnake border-evosnake-border bg-evosnake-surface2 grid gap-1 border px-3 py-2.5"
						>
							<div class="text-evosnake-muted text-xs font-extrabold tracking-wider uppercase">
								{{ t('game.mode') }}
							</div>
							<div class="text-evosnake-text text-sm font-bold">
								{{ t(`difficulty.${mode}`) }}
							</div>
						</div>
						<div
							class="rounded-evosnake border-evosnake-border bg-evosnake-surface2 grid gap-1 border px-3 py-2.5"
						>
							<div class="text-evosnake-muted text-xs font-extrabold tracking-wider uppercase">
								{{ t('gameOver.length') }}
							</div>
							<div class="text-evosnake-text text-sm font-bold">
								{{ length }}
							</div>
						</div>
					</div>

					<div
						v-if="uploadError"
						class="rounded-evosnake border-evosnake-danger bg-evosnake-danger/10 text-evosnake-danger border px-3 py-2 text-sm"
					>
						{{ t(uploadError) }}
					</div>
					<div
						v-else-if="isUploading"
						class="text-evosnake-muted text-center text-sm"
					>
						{{ t('gameOver.uploading') }}
					</div>
					<div
						v-else
						class="text-evosnake-primary text-center text-sm"
					>
						{{ t('gameOver.uploaded') }}
					</div>
				</div>

				<div class="grid grid-cols-2 gap-3">
					<button
						type="button"
						class="rounded-evosnake bg-evosnake-primary hover:bg-evosnake-primaryHover px-4 py-2.5 font-bold text-[#08100b] transition-colors"
						@click="emit('playAgain')"
					>
						{{ t('gameOver.playAgain') }}
					</button>
					<button
						type="button"
						class="rounded-evosnake border-evosnake-border bg-evosnake-surface2 text-evosnake-text hover:border-evosnake-primary border px-4 py-2.5 font-bold transition-colors"
						@click="emit('close')"
					>
						{{ t('gameOver.mainMenu') }}
					</button>
				</div>
			</section>
		</div>
	</Teleport>
</template>
