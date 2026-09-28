<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useRecordDetail } from '@/composables/useRecordDetail'
import { useInvoiceApi } from '../composables/useInvoiceApi'
import { formatMoney } from '@/core/formatting/money'
import AppButton from '@/components/ui/AppButton.vue'
const props = defineProps<{ invoiceId: string }>()
const { t } = useI18n()
const api = useInvoiceApi()
const {
    record: settlement,
    loading,
    error,
    refresh,
} = useRecordDetail(
    { get: api.settlement, subscribe: api.subscribe },
    'invoices',
    true,
    () => props.invoiceId,
)
</script>
<template>
    <section class="panel space-y-4">
        <h2 class="text-lg font-semibold">{{ t('invoices.settlementSummary') }}</h2>
        <p v-if="loading" role="status">{{ t('invoices.loading') }}</p>
        <div v-else-if="error" role="alert">
            <p>{{ t(error) }}</p>
            <AppButton @click="refresh">{{ t('invoices.refresh') }}</AppButton>
        </div>
        <template v-else-if="settlement">
            <p>{{ t('invoices.asOf', { date: settlement.operationalDate }) }}</p>
            <p v-if="!settlement.issuedRevisionNumber">{{ t('invoices.noIssued') }}</p>
            <template v-else>
                <dl class="grid gap-4 sm:grid-cols-3">
                    <div>
                        <dt>{{ t('invoices.approvedCredit') }}</dt>
                        <dd class="font-bold">{{ formatMoney(settlement.approvedCredit) }}</dd>
                    </div>
                    <div>
                        <dt>{{ t('invoices.outstandingAmount') }}</dt>
                        <dd>{{ formatMoney(settlement.outstandingAmount) }}</dd>
                    </div>
                    <div>
                        <dt>{{ t('invoices.overdue') }}</dt>
                        <dd>{{ formatMoney(settlement.overdueAmount) }}</dd>
                    </div>
                </dl>
                <ul class="divide-y divide-line">
                    <li
                        v-for="term in settlement.terms"
                        :key="term.index"
                        class="grid gap-2 py-3 sm:grid-cols-3"
                    >
                        <p class="font-semibold">{{ term.label }}</p>
                        <p>
                            {{ t('invoices.termOutstanding') }}:
                            {{ formatMoney(term.outstandingAmount) }}
                        </p>
                        <p>
                            {{ term.dueDate ?? t('invoices.noDueDate') }}
                            <span v-if="term.overdue" class="font-semibold text-red-700">{{
                                t('invoices.overdue')
                            }}</span>
                        </p>
                    </li>
                </ul>
            </template>
        </template>
    </section>
</template>
