<script setup lang="ts">
import PurchaseOrderInvoiceSummary from '@/views/invoices/components/PurchaseOrderInvoiceSummary.vue'
import OrderAssignments from './components/OrderAssignments.vue'
import { hasBusinessPermission } from '@/core/domain/record-policy'
import { computed, reactive } from 'vue'
import { useRoute } from 'vue-router'
import { useOrderReview } from './composables/useOrderReview'
import { useOrderSubmit } from './composables/useOrderSubmit'
import { useUnsavedChanges } from '@/composables/useUnsavedChanges'
import AppReviewDialog from '@/components/ui/AppReviewDialog.vue'
import AppConfirmDialog from '@/components/ui/AppConfirmDialog.vue'
import { useI18n } from 'vue-i18n'
import { useSessionStore } from '@/stores/session'
import { canActOnOrder } from '@/core/domain/order-policy'
import { useOrderDetail } from './composables/useOrderDetail'
import AppButton from '@/components/ui/AppButton.vue'
import AppPageHeader from '@/components/ui/AppPageHeader.vue'
import OrderStatus from './components/OrderStatus.vue'
const { t } = useI18n()
const session = useSessionStore()
const { order, loading, error, refresh } = useOrderDetail()
const route = useRoute()
const review = reactive(useOrderReview(order, refresh, () => route.params.id))
const submission = reactive(useOrderSubmit(order))
const discard = reactive(
    useUnsavedChanges(
        () => session.status === 'authenticated' && !!review.reason.trim(),
        () => session.status === 'authenticated' && (review.pending || submission.pending),
    ),
)
function closeReview(): void {
    discard.requestDiscard(() => review.close())
}

const editable = computed(() => !!order.value && canActOnOrder(session.user, order.value, 'update'))
</script>
<template>
    <section class="space-y-6">
        <AppPageHeader :title="t('orders.detail')">
            <template #actions>
                <RouterLink
                    :to="{ name: 'orders', query: $route.query }"
                    class="secondary-button"
                    >{{ t('orders.back') }}</RouterLink
                >
            </template>
        </AppPageHeader>
        <p v-if="loading" role="status">{{ t('orders.loading') }}</p>
        <div v-else-if="error" class="panel space-y-3" role="alert">
            <p>{{ t(error) }}</p>
            <AppButton @click="refresh">{{ t('orders.refresh') }}</AppButton>
        </div>
        <template v-else-if="order">
            <div class="panel space-y-4">
                <div class="flex flex-wrap items-start justify-between gap-4">
                    <div class="min-w-0">
                        <h2 class="break-words text-xl font-semibold">
                            {{ order.purchaseOrderNumber }}
                        </h2>
                        <p class="mt-1 break-words text-muted">{{ order.buyerName }}</p>
                    </div>
                    <OrderStatus :status="order.status" />
                </div>

                <p class="whitespace-pre-wrap break-words">{{ order.notes }}</p>
                <p v-if="order.rejectionReason">
                    {{ t('orders.rejectionReason') }}: {{ order.rejectionReason }}
                </p>
                <div class="flex flex-wrap gap-3">
                    <RouterLink
                        v-if="editable && !submission.pending && !submission.uncertain"
                        :to="{ name: 'order-edit', params: { id: order.id }, query: $route.query }"
                        class="primary-button"
                        >{{ t('orders.edit') }}</RouterLink
                    ><RouterLink
                        :to="{
                            name: 'purchase-order-detail',
                            params: { id: order.purchaseOrderId },
                        }"
                        class="secondary-button"
                        >{{ t('orders.parent') }}</RouterLink
                    >
                </div>
            </div>

            <div v-if="submission.error" class="panel space-y-3" role="alert">
                <p>{{ t(submission.error) }}</p>
                <p v-if="submission.uncertain">{{ t('orders.uncertain') }}</p>
                <AppButton v-if="!submission.uncertain" variant="secondary" @click="refresh">{{
                    t('orders.refresh')
                }}</AppButton>
            </div>
            <div v-if="review.error && !review.action" class="panel space-y-3" role="alert">
                <p>{{ t(review.error) }}</p>
                <AppButton variant="secondary" @click="review.reload">{{
                    t('orders.refresh')
                }}</AppButton>
            </div>
            <div class="flex flex-wrap gap-3">
                <AppButton
                    v-if="submission.canSubmit"
                    :pending="submission.pending"
                    @click="submission.confirming = true"
                    >{{
                        t(submission.uncertain ? 'orders.retryWrite' : 'orders.submit')
                    }}</AppButton
                ><AppButton
                    v-if="review.canApprove"
                    :disabled="review.pending"
                    @click="review.open('approve')"
                    >{{ t('orders.approve') }}</AppButton
                ><AppButton
                    v-if="review.canReject"
                    variant="secondary"
                    :disabled="review.pending"
                    @click="review.open('reject')"
                    >{{ t('orders.reject') }}</AppButton
                >
            </div>
            <PurchaseOrderInvoiceSummary
                v-if="hasBusinessPermission(session.user, 'invoices.read')"
                :purchase-order-id="order.purchaseOrderId"
                down-payment-only
            />
            <OrderAssignments
                v-if="hasBusinessPermission(session.user, 'assignments.read')"
                :key="order.id"
                :order="order"
                @changed="refresh"
            />
        </template>
        <AppReviewDialog
            v-model:reason="review.reason"
            resource="orders"
            reason-id="order-rejection-reason"
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
            :title="t('orders.discardTitle')"
            :description="t('orders.discardDescription')"
            @confirm="discard.confirm"
            @cancel="discard.cancel"
        />
        <AppConfirmDialog
            :open="submission.confirming"
            :title="t('orders.submit')"
            :description="t('orders.submitDescription')"
            :pending="submission.pending"
            @confirm="submission.submit"
            @cancel="submission.confirming = false"
        />
    </section>
</template>
