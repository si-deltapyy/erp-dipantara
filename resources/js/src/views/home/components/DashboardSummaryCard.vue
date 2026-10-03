<script setup lang="ts">
import { RouterLink } from 'vue-router'
import AppIcon from '@/components/ui/AppIcon.vue'
withDefaults(
    defineProps<{
        title: string
        value: string
        caption: string
        targetPath?: string
        icon?: 'document' | 'truck' | 'box' | 'wallet'
    }>(),
    { icon: 'document' },
)
</script>
<template>
    <component
        :is="targetPath ? RouterLink : 'article'"
        :to="targetPath"
        class="panel wf-summary-card block min-w-0"
    >
        <h2 class="text-sm font-semibold text-muted">{{ title }}</h2>
        <span class="wf-summary-icon"><AppIcon :name="icon" :size="32" /></span>
        <p class="mt-3 break-words text-3xl font-semibold tracking-tight">{{ value }}</p>
        <p class="mt-2 text-xs text-muted">{{ caption }}</p>
    </component>
</template>
