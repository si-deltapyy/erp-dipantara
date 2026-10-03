<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { PurchaseOrder } from '@/core/types/purchase-order'
import AppStatusBadge from '@/components/ui/AppStatusBadge.vue'
defineProps<{ status: PurchaseOrder['status'] }>()
const { t } = useI18n()
const tones = {
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
