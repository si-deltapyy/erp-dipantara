<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { PurchaseOrder, PurchaseOrderRecord } from '@/core/types/purchase-order'
import AppStatusBadge from '@/components/ui/AppStatusBadge.vue'
defineProps<{ status: PurchaseOrder['status'] | PurchaseOrderRecord['status'] }>()
const { t } = useI18n()
const tones = {
    pending: 'warning',
    on_process: 'info',
    delivered: 'success',
    completed: 'neutral',
    draft: 'neutral',
    submitted: 'warning',
    approved: 'success',
    rejected: 'danger',
    closed: 'neutral',
} as const
</script>
<template>
    <AppStatusBadge :tone="tones[status]">{{
        t('purchase-orders.statuses.' + status)
    }}</AppStatusBadge>
</template>
