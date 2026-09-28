<script setup lang="ts">
import { useI18n } from 'vue-i18n'
defineProps<{ title: string; value: string; caption: string; targetPath: string }>()
const { t } = useI18n()
</script>
<template>
    <RouterLink
        :to="targetPath"
        class="panel block min-w-0 space-y-4 transition-shadow hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
    >
        <h2 class="text-sm font-semibold text-muted">{{ title }}</h2>
        <p class="break-words text-2xl font-bold tracking-tight">{{ value }}</p>
        <p class="text-xs text-muted">{{ caption }}</p>
        <p class="text-sm font-semibold text-primary">
            {{ t('dashboard.openList') }} <span aria-hidden="true">&rarr;</span>
        </p>
    </RouterLink>
</template>
