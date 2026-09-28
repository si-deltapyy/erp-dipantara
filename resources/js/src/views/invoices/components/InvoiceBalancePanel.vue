<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { InvoiceDirectionSummary } from '@/core/types/invoice-summary'
import { formatMoney } from '@/core/formatting/money'
defineProps<{
    balance: InvoiceDirectionSummary
    direction: 'receivable' | 'payable'
    downPaymentOnly?: boolean
}>()
const { t } = useI18n()
</script>
<template>
    <section class="min-w-0 space-y-3 rounded border border-line p-4">
        <h3 class="font-semibold">{{ t('invoices.' + direction) }}</h3>
        <dl v-if="!downPaymentOnly" class="grid gap-3 sm:grid-cols-2">
            <div
                v-for="field in [
                    'invoiceAmount',
                    'approvedCredit',
                    'outstandingAmount',
                    'overdueAmount',
                ] as const"
                :key="field"
            >
                <dt class="text-muted">{{ t('invoices.' + field) }}</dt>
                <dd>{{ formatMoney(balance[field]) }}</dd>
            </div>
        </dl>
        <h4 class="font-semibold">{{ t('invoices.down_payment') }}</h4>
        <p v-if="!balance.downPayment.issuedInvoiceCount">{{ t('invoices.noDownPayment') }}</p>
        <template v-else>
            <p>
                {{
                    t(
                        balance.downPayment.outstandingAmount === '0.00'
                            ? 'invoices.dpPaid'
                            : balance.downPayment.approvedCredit === '0.00'
                              ? 'invoices.dpUnpaid'
                              : 'invoices.dpPartial',
                    )
                }}
            </p>
            <p>
                {{ t('invoices.approvedCredit') }}:
                {{ formatMoney(balance.downPayment.approvedCredit) }}
            </p>
            <p>
                {{ t('invoices.outstandingAmount') }}:
                {{ formatMoney(balance.downPayment.outstandingAmount) }}
            </p>
        </template>
    </section>
</template>
