<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useRecordDetail } from '@/composables/useRecordDetail'
import { useInvoiceApi } from '../composables/useInvoiceApi'
import InvoiceBalancePanel from './InvoiceBalancePanel.vue'
import AppButton from '@/components/ui/AppButton.vue'
const props = defineProps<{ purchaseOrderId: string; downPaymentOnly?: boolean }>()
const { t } = useI18n()
const api = useInvoiceApi()
const {
    record: summary,
    loading,
    error,
    refresh,
} = useRecordDetail(
    { get: api.summary, subscribe: api.subscribe },
    'invoices',
    true,
    () => props.purchaseOrderId,
)
</script>
<template>
    <section class="panel space-y-4">
        <h2 class="text-lg font-semibold">
            {{
                t(downPaymentOnly ? 'invoices.downPaymentSummary' : 'invoices.purchaseOrderSummary')
            }}
        </h2>
        <p v-if="loading" role="status">{{ t('invoices.loading') }}</p>
        <div v-else-if="error" role="alert">
            <p>{{ t(error) }}</p>
            <AppButton @click="refresh">{{ t('invoices.refresh') }}</AppButton>
        </div>
        <template v-else-if="summary">
            <p>{{ t('invoices.asOf', { date: summary.operationalDate }) }}</p>
            <div class="grid gap-4 lg:grid-cols-2">
                <InvoiceBalancePanel
                    v-for="direction in ['receivable', 'payable'] as const"
                    :key="direction"
                    :balance="summary[direction]"
                    :direction="direction"
                    :down-payment-only="downPaymentOnly"
                />
            </div>
            <RouterLink
                :to="{ name: 'invoices', query: { purchaseOrderId } }"
                class="secondary-button"
                >{{ t('invoices.monitor') }}</RouterLink
            >
        </template>
    </section>
</template>
