<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { Order } from '@/core/types/order'
import AppStatusBadge from '@/components/ui/AppStatusBadge.vue'
defineProps<{ status: Order['status'] }>()
const { t } = useI18n()
const tones = {
    draft: 'neutral',
    submitted: 'warning',
    approved: 'success',
    rejected: 'danger',
} as const
</script>
<template>
    <AppStatusBadge :tone="tones[status]">{{ t('orders.statuses.' + status) }}</AppStatusBadge>
</template>
