<script setup lang="ts">
import ClosingEligibilityPanel from '@/views/closing/components/ClosingEligibilityPanel.vue'
import PurchaseOrderInvoiceSummary from '@/views/invoices/components/PurchaseOrderInvoiceSummary.vue'
import { evaluateRecordAccess } from '@/core/domain/record-policy'
import { computed, reactive } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useSessionStore } from '@/stores/session'
import { canActOnPurchaseOrder } from '@/core/domain/purchase-order-policy'
import { usePurchaseOrderDetail } from './composables/usePurchaseOrderDetail'
import { usePurchaseOrderSubmit } from './composables/usePurchaseOrderSubmit'
import { formatPurchaseOrderMoney } from './purchase-order-format'
import { usePurchaseOrderReview } from './composables/usePurchaseOrderReview'
import { useUnsavedChanges } from '@/composables/useUnsavedChanges'
import PurchaseOrderReviewDialog from './components/PurchaseOrderReviewDialog.vue'
import PurchaseOrderDocuments from './components/PurchaseOrderDocuments.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppPageHeader from '@/components/ui/AppPageHeader.vue'
import PurchaseOrderStatus from './components/PurchaseOrderStatus.vue'
import PurchaseOrderLines from './components/PurchaseOrderLines.vue'
import AppConfirmDialog from '@/components/ui/AppConfirmDialog.vue'
const { t } = useI18n()
const session = useSessionStore()
const route = useRoute()
const { order, loading, error, refresh } = usePurchaseOrderDetail()
const review = reactive(usePurchaseOrderReview(order, refresh, () => route.params.id))
const discard = reactive(
    useUnsavedChanges(
        () => session.status === 'authenticated' && !!review.reason.trim(),
        () => session.status === 'authenticated' && review.pending,
    ),
)
function closeReview(): void {
    discard.requestDiscard(() => review.close())
}
const {
    pending,
    confirming,
    error: submitError,
    uncertain,
    canSubmit,
    submit,
} = usePurchaseOrderSubmit(order)
const canEdit = computed(
    () => !!order.value && canActOnPurchaseOrder(session.user, order.value, 'update'),
)
</script>
<template>
    <section class="space-y-6">
        <AppPageHeader :title="t('purchase-orders.detail')"
            ><template #actions>
                <RouterLink
                    :to="{ name: 'purchase-orders', query: $route.query }"
                    class="secondary-button"
                    >{{ t('purchase-orders.back') }}</RouterLink
                >
            </template></AppPageHeader
        >
        <p v-if="loading" role="status">{{ t('purchase-orders.loading') }}</p>
        <div v-else-if="error" role="alert" class="panel space-y-3">
            <p>{{ t(error) }}</p>
            <AppButton @click="refresh">{{ t('purchase-orders.refresh') }}</AppButton>
        </div>
        <template v-else-if="order">
            <div class="panel space-y-5">
                <div class="flex flex-wrap items-center justify-between gap-3">
                    <h2 class="break-words text-xl font-semibold">{{ order.number }}</h2>
                    <PurchaseOrderStatus :status="order.status" />
                </div>
                <dl class="grid gap-4 sm:grid-cols-2">
                    <div>
                        <dt class="text-sm text-muted">{{ t('purchase-orders.buyer') }}</dt>
                        <dd class="break-words font-semibold">{{ order.buyerName }}</dd>
                    </div>
                    <div>
                        <dt class="text-sm text-muted">{{ t('purchase-orders.orderDate') }}</dt>
                        <dd>{{ order.orderDate }}</dd>
                    </div>
                    <div>
                        <dt class="text-sm text-muted">{{ t('purchase-orders.totalAmount') }}</dt>
                        <dd class="break-words text-lg font-bold text-primary-strong">
                            {{ formatPurchaseOrderMoney(order.totalAmount) }}
                        </dd>
                    </div>
                    <div>
                        <dt class="text-sm text-muted">{{ t('purchase-orders.notes') }}</dt>
                        <dd class="whitespace-pre-wrap break-words">{{ order.notes || '—' }}</dd>
                    </div>
                </dl>
            </div>
            <div v-if="order.rejectionReason" class="panel space-y-2">
                <h2 class="font-semibold">{{ t('purchase-orders.rejectionReason') }}</h2>
                <p class="whitespace-pre-wrap break-words">{{ order.rejectionReason }}</p>
            </div>
            <PurchaseOrderLines :lines="order.lines" />
            <ClosingEligibilityPanel
                v-if="session.user?.permissions.includes('closings.read.all')"
                :purchase-order-id="order.id"
            />
            <PurchaseOrderInvoiceSummary
                v-if="evaluateRecordAccess(session.user, 'invoices.read', order) === 'allowed'"
                :purchase-order-id="order.id"
            />
            <RouterLink
                v-if="evaluateRecordAccess(session.user, 'payments.read', order) === 'allowed'"
                :to="{ name: 'payments', query: { purchaseOrderId: order.id } }"
                class="secondary-button"
                >{{ t('payments.monitor') }}</RouterLink
            >
            <div v-if="submitError" role="alert" class="panel space-y-2 text-danger">
                <p>{{ t(submitError) }}</p>
                <p v-if="uncertain">{{ t('purchase-orders.uncertain') }}</p>
                <AppButton v-if="!uncertain" variant="secondary" @click="refresh">{{
                    t('purchase-orders.refresh')
                }}</AppButton>
            </div>
            <div v-if="review.error && !review.action" role="alert" class="panel space-y-3">
                <p>{{ t(review.error) }}</p>
                <AppButton variant="secondary" @click="review.reload">{{
                    t('purchase-orders.refresh')
                }}</AppButton>
            </div>
            <RouterLink
                v-if="evaluateRecordAccess(session.user, 'deliveries.read', order) === 'allowed'"
                :to="{ name: 'deliveries', query: { purchaseOrderId: order.id } }"
                class="secondary-button"
                >{{ t('deliveries.monitor') }}</RouterLink
            >
            <RouterLink
                v-if="evaluateRecordAccess(session.user, 'invoices.read', order) === 'allowed'"
                :to="{ name: 'invoices', query: { purchaseOrderId: order.id } }"
                class="secondary-button"
                >{{ t('invoices.monitor') }}</RouterLink
            >
            <PurchaseOrderDocuments :key="order.id" :order="order" />
            <div class="wf-form-actions">
                <AppButton
                    v-if="review.canApprove"
                    :disabled="review.pending"
                    @click="review.open('approve')"
                    >{{ t('purchase-orders.approve') }}</AppButton
                >
                <AppButton
                    v-if="review.canReject"
                    variant="secondary"
                    :disabled="review.pending"
                    @click="review.open('reject')"
                    >{{ t('purchase-orders.reject') }}</AppButton
                >
                <RouterLink
                    v-if="canEdit && !pending && !uncertain"
                    :to="{
                        name: 'purchase-order-edit',
                        params: { id: order.id },
                        query: $route.query,
                    }"
                    class="secondary-button"
                    >{{ t('purchase-orders.edit') }}</RouterLink
                >
                <AppButton v-if="canSubmit" :pending="pending" @click="confirming = true">{{
                    t(uncertain ? 'purchase-orders.retryWrite' : 'purchase-orders.submit')
                }}</AppButton>
            </div>
        </template>
        <PurchaseOrderReviewDialog
            v-model:reason="review.reason"
            :action="review.action"
            :reason-error="review.reasonError"
            :error="review.error"
            :pending="review.pending"
            :uncertain="review.uncertain"
            :blocked="review.blocked"
            @close="closeReview"
            @confirm="review.submit"
            @reload="review.reload"
        />
        <AppConfirmDialog
            :open="discard.confirming"
            :title="t('purchase-orders.discardTitle')"
            :description="t('purchase-orders.discardDescription')"
            @confirm="discard.confirm"
            @cancel="discard.cancel"
        />
        <AppConfirmDialog
            :open="confirming"
            :title="t('purchase-orders.submit')"
            :description="t('purchase-orders.submitDescription')"
            :pending="pending"
            @confirm="submit"
            @cancel="confirming = false"
        />
    </section>
</template>
