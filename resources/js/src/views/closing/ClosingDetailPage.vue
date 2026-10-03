<script setup lang="ts">
import AppPageHeader from '@/components/ui/AppPageHeader.vue'
import AppPanel from '@/components/ui/AppPanel.vue'
import AppState from '@/components/ui/AppState.vue'
import AppStatusBadge from '@/components/ui/AppStatusBadge.vue'

import { reactive } from 'vue'
import { useRoute } from 'vue-router'
import { useClosingReview } from './composables/useClosingReview'
import { useUnsavedChanges } from '@/composables/useUnsavedChanges'
import AppReviewDialog from '@/components/ui/AppReviewDialog.vue'
import AppConfirmDialog from '@/components/ui/AppConfirmDialog.vue'
import { useI18n } from 'vue-i18n'
import { useSessionStore } from '@/stores/session'
import { evaluateRecordAccess } from '@/core/domain/record-policy'
import { useRecordDetail } from '@/composables/useRecordDetail'
import { useClosingApi } from './composables/useClosingApi'
import ClosingEligibilityPanel from './components/ClosingEligibilityPanel.vue'
import AppButton from '@/components/ui/AppButton.vue'
const { t } = useI18n()
const session = useSessionStore()
const {
    record: closing,
    loading,
    error,
    refresh,
} = useRecordDetail(useClosingApi(), 'closings', false)
const route = useRoute()
const review = reactive(useClosingReview(closing, refresh, () => route.params.id))
const discard = reactive(
    useUnsavedChanges(
        () => session.status === 'authenticated' && !!review.reason.trim(),
        () => session.status === 'authenticated' && review.pending,
    ),
)
function closeReview(): void {
    discard.requestDiscard(() => review.close())
}
</script>
<template>
    <section class="min-w-0 space-y-6">
        <AppPageHeader :title="t('closings.detail')"
            ><template #actions>
                <RouterLink
                    :to="{ name: 'closings', query: $route.query }"
                    class="secondary-button"
                    >{{ t('closings.back') }}</RouterLink
                >
            </template></AppPageHeader
        >
        <AppState v-if="loading" kind="loading" :message="t('closings.loading')" />
        <AppState v-else-if="error" kind="error" :message="t(error)" @retry="refresh" />
        <template v-else-if="closing">
            <AppPanel :title="closing.purchaseOrderNumber" class="space-y-5 break-words">
                <AppStatusBadge
                    :tone="
                        closing.status === 'approved'
                            ? 'success'
                            : closing.status === 'rejected'
                              ? 'danger'
                              : 'warning'
                    "
                    >{{ t('closings.statuses.' + closing.status) }}</AppStatusBadge
                >
                <p v-if="closing.status === 'approved'" role="status" class="text-sm text-muted">
                    {{ t('closings.reasons.purchase_order_closed') }}
                </p>
                <p class="break-words">{{ closing.notes ?? t('closings.noNotes') }}</p>
                <p v-if="closing.rejectionReason" class="break-words">
                    {{ closing.rejectionReason }}
                </p>
                <p v-if="closing.status === 'requested'">{{ t('closings.requestDescription') }}</p>
                <RouterLink
                    v-if="
                        evaluateRecordAccess(session.user, 'purchase-orders.read', closing) ===
                        'allowed'
                    "
                    :to="{ name: 'purchase-order-detail', params: { id: closing.purchaseOrderId } }"
                    class="secondary-button"
                    >{{ t('closings.openPurchaseOrder') }}</RouterLink
                >
            </AppPanel>
            <AppPanel v-if="review.canApprove || review.canReject" :title="t('closings.review')"
                ><div class="flex flex-wrap gap-3">
                    <AppButton
                        v-if="review.canApprove"
                        :disabled="review.pending"
                        @click="review.open('approve')"
                        >{{ t('closings.approve') }}</AppButton
                    >
                    <AppButton
                        v-if="review.canReject"
                        variant="secondary"
                        :disabled="review.pending"
                        @click="review.open('reject')"
                        >{{ t('closings.reject') }}</AppButton
                    >
                </div></AppPanel
            >
            <ClosingEligibilityPanel
                :key="closing.version"
                :purchase-order-id="closing.purchaseOrderId"
            />
        </template>
        <AppReviewDialog
            resource="closings"
            reason-id="closing-review-reason"
            :action="review.action"
            :reason="review.reason"
            :reason-error="review.reasonError"
            :error="review.error"
            :pending="review.pending"
            :uncertain="review.uncertain"
            :blocked="review.blocked"
            @update:reason="review.reason = $event"
            @close="closeReview"
            @confirm="review.submit"
            @reload="review.reload"
        />
        <AppConfirmDialog
            :open="discard.confirming"
            :title="t('closings.discardTitle')"
            :description="t('closings.discardDescription')"
            @confirm="discard.confirm"
            @cancel="discard.cancel"
        />
    </section>
</template>
