<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { PurchaseOrderReviewAction } from '@/core/types/purchase-order'
import AppModal from '@/components/ui/AppModal.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppTextarea from '@/components/ui/AppTextarea.vue'
defineProps<{
    action?: PurchaseOrderReviewAction
    reason: string
    reasonError: string
    error: string
    pending: boolean
    uncertain: boolean
    blocked: boolean
}>()
defineEmits<{ 'update:reason': [reason: string]; close: []; confirm: []; reload: [] }>()
const { t } = useI18n()
</script>
<template>
    <AppModal
        :open="!!action"
        :title="t('purchase-orders.' + (action || 'approve'))"
        :busy="pending || uncertain"
        :initial-focus="action === 'reject' ? '#po-rejection-reason' : '[data-review-cancel]'"
        @close="$emit('close')"
    >
        <div class="space-y-4">
            <p>
                {{
                    t(
                        'purchase-orders.' +
                            (action === 'reject' ? 'rejectDescription' : 'approveDescription'),
                    )
                }}
            </p>
            <AppTextarea
                v-if="action === 'reject'"
                id="po-rejection-reason"
                :model-value="reason"
                :label="t('purchase-orders.reason')"
                :error="reasonError ? t(reasonError) : undefined"
                :disabled="pending || uncertain"
                @update:model-value="$emit('update:reason', $event)"
            />
            <p v-if="error" role="alert" class="text-red-700">{{ t(error) }}</p>
            <p v-if="uncertain" role="status">{{ t('purchase-orders.uncertain') }}</p>
            <p v-if="blocked">{{ t('purchase-orders.reviewConflict') }}</p>
        </div>
        <template #footer>
            <AppButton
                data-review-cancel
                variant="secondary"
                :disabled="pending || uncertain"
                @click="$emit('close')"
                >{{ t('ui.cancel') }}</AppButton
            >
            <AppButton
                v-if="blocked || uncertain"
                variant="secondary"
                :disabled="pending"
                @click="$emit('reload')"
                >{{ t('purchase-orders.refresh') }}</AppButton
            >
            <AppButton :pending="pending" :disabled="blocked" @click="$emit('confirm')">{{
                t(uncertain ? 'purchase-orders.retryWrite' : 'ui.confirm')
            }}</AppButton>
        </template>
    </AppModal>
</template>
