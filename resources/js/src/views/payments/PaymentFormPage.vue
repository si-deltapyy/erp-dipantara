<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useSessionStore } from '@/stores/session'
import { canActOnPayment } from '@/core/domain/payment-policy'
import { evaluateRecordAccess } from '@/core/domain/record-policy'
import { useRecordDetail } from '@/composables/useRecordDetail'
import { usePaymentApi } from './composables/usePaymentApi'
import { useInvoiceApi } from '@/views/invoices/composables/useInvoiceApi'
import InvoiceSettlement from '@/views/invoices/components/InvoiceSettlement.vue'
import PaymentEditor from './components/PaymentEditor.vue'
import AppButton from '@/components/ui/AppButton.vue'
const { t } = useI18n()
const route = useRoute()
const session = useSessionStore()
const {
    record: payment,
    loading,
    error,
    refresh,
} = useRecordDetail(usePaymentApi(), 'payments', false)
const invoiceId = computed(
    () =>
        payment.value?.invoiceId ??
        (typeof route.query.invoiceId === 'string' ? route.query.invoiceId : undefined),
)
const invoiceState = useRecordDetail(useInvoiceApi(), 'invoices', false, () => invoiceId.value)
const {
    record: invoice,
    loading: invoiceLoading,
    error: invoiceError,
    refresh: refreshInvoice,
} = invoiceState
const editing = computed(() => typeof route.params.id === 'string')
const permitted = computed(
    () =>
        !!invoice.value?.issuedRevisionNumber &&
        (editing.value
            ? !!payment.value && canActOnPayment(session.user, payment.value, 'update')
            : evaluateRecordAccess(session.user, 'payments.create', invoice.value) === 'allowed'),
)
async function refreshAll(): Promise<void> {
    await refresh()
    await refreshInvoice()
}
</script>
<template>
    <section class="mx-auto max-w-4xl space-y-6">
        <h1 class="text-2xl font-bold">{{ t(editing ? 'payments.edit' : 'payments.start') }}</h1>
        <p v-if="loading || invoiceLoading" role="status">{{ t('payments.loading') }}</p>
        <div v-else-if="error || invoiceError" role="alert" class="panel space-y-3">
            <p>{{ t(error || invoiceError) }}</p>
            <AppButton @click="refreshAll">{{ t('payments.refresh') }}</AppButton>
        </div>
        <PaymentEditor
            v-else-if="permitted && invoice"
            :key="payment?.id ?? invoice.id"
            :payment="payment"
            :invoice="invoice"
        />
        <div v-else class="panel space-y-3">
            <p role="alert">{{ t('payments.chooseInvoice') }}</p>
            <RouterLink :to="{ name: 'invoices' }" class="secondary-button">{{
                t('payments.add')
            }}</RouterLink>
        </div>
        <InvoiceSettlement v-if="invoice && permitted" :invoice-id="invoice.id" />
    </section>
</template>
