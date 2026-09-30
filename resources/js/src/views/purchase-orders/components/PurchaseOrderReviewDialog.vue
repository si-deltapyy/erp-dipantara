<script setup lang="ts">
import type { PurchaseOrderReviewAction } from '@/core/types/purchase-order'
import AppReviewDialog from '@/components/ui/AppReviewDialog.vue'
defineProps<{
    action?: PurchaseOrderReviewAction
    reason: string
    reasonError: string
    error: string
    pending: boolean
    uncertain: boolean
    blocked: boolean
}>()
const emit = defineEmits<{
    'update:reason': [reason: string]
    close: []
    confirm: []
    reload: []
}>()
</script>
<template>
    <AppReviewDialog
        v-bind="$props"
        resource="purchase-orders"
        reason-id="po-rejection-reason"
        @update:reason="emit('update:reason', $event)"
        @close="emit('close')"
        @confirm="emit('confirm')"
        @reload="emit('reload')"
    />
</template>
