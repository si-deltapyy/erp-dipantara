<script setup lang="ts">
import { useRoute } from 'vue-router'
import { usePaymentReview } from './composables/usePaymentReview'
import { useUnsavedChanges } from '@/composables/useUnsavedChanges'
import AppReviewDialog from '@/components/ui/AppReviewDialog.vue'
import { computed, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRecordDetail } from '@/composables/useRecordDetail'
import { usePaymentApi } from './composables/usePaymentApi'
import { usePaymentSubmit } from './composables/usePaymentSubmit'
import { canActOnPayment } from '@/core/domain/payment-policy'
import { formatMoney } from '@/core/formatting/money'
import { useSessionStore } from '@/stores/session'
import InvoiceSettlement from '@/views/invoices/components/InvoiceSettlement.vue'
import PaymentDocument from './components/PaymentDocument.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppConfirmDialog from '@/components/ui/AppConfirmDialog.vue'
const { t } = useI18n()
const session = useSessionStore()
const {
    record: payment,
    loading,
    error,
    refresh,
} = useRecordDetail(usePaymentApi(), 'payments', false)
const route = useRoute()
const review = reactive(usePaymentReview(payment, refresh, () => route.params.id))
const discard = reactive(
    useUnsavedChanges(
        () => session.status === 'authenticated' && !!review.reason.trim(),
        () => session.status === 'authenticated' && review.pending,
    ),
)
function closeReview(): void {
    discard.requestDiscard(() => review.close())
}
const submission = reactive(usePaymentSubmit(payment))
const canEdit = computed(
    () => payment.value && canActOnPayment(session.user, payment.value, 'update'),
)
</script>
<template>
    <section class="space-y-6">
        <header class="flex flex-wrap items-center justify-between gap-3">
            <h1 class="text-2xl font-bold">{{ t('payments.detail') }}</h1>
            <RouterLink :to="{ name: 'payments', query: $route.query }" class="secondary-button">{{
                t('payments.back')
            }}</RouterLink>
        </header>
        <p v-if="loading" role="status">{{ t('payments.loading') }}</p>
        <div v-else-if="error" role="alert" class="panel space-y-3">
            <p>{{ t(error) }}</p>
            <AppButton @click="refresh">{{ t('payments.refresh') }}</AppButton>
        </div>
        <template v-else-if="payment">
            <div class="panel space-y-4">
                <RouterLink
                    :to="{ name: 'invoice-detail', params: { id: payment.invoiceId } }"
                    class="break-words font-semibold text-primary underline"
                    >{{ payment.invoiceNumber }}</RouterLink
                >
                <dl class="grid gap-4 sm:grid-cols-2">
                    <div
                        v-for="field in [
                            'purchaseOrderNumber',
                            'counterpartyName',
                            'paymentDate',
                            'sourceAccountLabel',
                            'destinationAccountLabel',
                        ] as const"
                        :key="field"
                    >
                        <dt class="text-muted">{{ t('payments.' + field) }}</dt>
                        <dd class="break-words">{{ payment[field] }}</dd>
                    </div>
                    <div>
                        <dt class="text-muted">{{ t('payments.status') }}</dt>
                        <dd>{{ t('payments.statuses.' + payment.status) }}</dd>
                    </div>
                    <div
                        v-for="field in [
                            'cashAmount',
                            'withholdingAmount',
                            'roundingAdjustment',
                            'creditAmount',
                        ] as const"
                        :key="field"
                    >
                        <dt class="text-muted">{{ t('payments.' + field) }}</dt>
                        <dd>{{ formatMoney(payment[field]) }}</dd>
                    </div>
                </dl>
                <p v-if="payment.notes" class="whitespace-pre-wrap break-words">
                    {{ payment.notes }}
                </p>
                <p v-if="payment.rejectionReason" role="status">{{ payment.rejectionReason }}</p>
                <RouterLink
                    v-if="canEdit && !submission.pending && !submission.uncertain"
                    :to="{ name: 'payment-edit', params: { id: payment.id } }"
                    class="secondary-button"
                    >{{ t('payments.edit') }}</RouterLink
                >
            </div>
            <InvoiceSettlement :key="payment.version" :invoice-id="payment.invoiceId" />
            <PaymentDocument :payment="payment" />
        </template>
        <p v-if="submission.error" role="alert">{{ t(submission.error) }}</p>
        <p v-if="submission.uncertain" role="status">{{ t('payments.uncertain') }}</p>
        <AppButton
            v-if="submission.canSubmit"
            :pending="submission.pending"
            @click="submission.confirming = true"
            >{{ t(submission.uncertain ? 'payments.retryWrite' : 'payments.submit') }}</AppButton
        >
        <div class="flex flex-wrap gap-3">
            <AppButton
                v-if="review.canApprove"
                :disabled="review.pending"
                @click="review.open('approve')"
                >{{ t('payments.approve') }}</AppButton
            >
            <AppButton
                v-if="review.canReject"
                variant="secondary"
                :disabled="review.pending"
                @click="review.open('reject')"
                >{{ t('payments.reject') }}</AppButton
            >
        </div>
        <p v-if="review.error && !review.action" role="alert">{{ t(review.error) }}</p>
        <AppReviewDialog
            v-model:reason="review.reason"
            resource="payments"
            reason-id="payment-rejection-reason"
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
            :title="t('payments.discardTitle')"
            :description="t('payments.discardDescription')"
            @confirm="discard.confirm"
            @cancel="discard.cancel"
        />
        <AppConfirmDialog
            :open="submission.confirming"
            :title="t('payments.submit')"
            :description="t('payments.submitDescription')"
            :pending="submission.pending"
            @confirm="submission.submit"
            @cancel="submission.confirming = false"
        />
    </section>
</template>
