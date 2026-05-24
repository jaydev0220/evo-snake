<script setup lang="ts">
	defineProps<{
		title: string;
		detail: string;
	}>();
</script>

<template>
	<div class="mb-3 flex items-end justify-between gap-3">
		<h3 class="text-evosnake-text text-lg font-extrabold tracking-tight">{{ title }}</h3>
		<div class="text-evosnake-muted text-xs font-extrabold tracking-wider uppercase">
			{{ detail }}
		</div>
	</div>
</template>
