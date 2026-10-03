<script setup lang="ts">
withDefaults(defineProps<{ tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info' }>(), {
    tone: 'neutral',
})
</script>

<template>
    <span class="wf-badge" :class="`wf-badge--${tone}`"><slot /></span>
</template>
