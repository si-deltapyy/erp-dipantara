<script setup lang="ts">
import AppPanel from '@/components/ui/AppPanel.vue'

import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useInvoiceVersions } from '../composables/useInvoiceVersions'
import { formatMoney } from '@/core/formatting/money'
import InvoiceDocument from './InvoiceDocument.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppButton from '@/components/ui/AppButton.vue'
const props = defineProps<{ invoiceId: string; revisionNumber: number }>()
const { t } = useI18n()
const { versions, loading, error, refresh } = useInvoiceVersions(() => props.invoiceId)
const selected = ref(String(props.revisionNumber))
const options = computed(() =>
    versions.value.map((invoice) => ({
        value: String(invoice.revisionNumber),
        label: `${invoice.revisionNumber} - ${t('invoices.statuses.' + invoice.status)}`,
    })),
)
const invoice = computed(() =>
    versions.value.find((invoice) => String(invoice.revisionNumber) === selected.value),
)
</script>
<template>
    <AppPanel :title="t('invoices.history')" class="min-w-0 space-y-5 break-words">
        <p v-if="loading" role="status">{{ t('invoices.loading') }}</p>
        <div v-else-if="error" role="alert">
            <p>{{ t(error) }}</p>
            <AppButton @click="refresh">{{ t('invoices.refresh') }}</AppButton>
        </div>
        <template v-else>
            <AppSelect
                id="invoice-version"
                v-model="selected"
                renderer="nice"
                :options="options"
                :label="t('invoices.version')"
            />
            <template v-if="invoice">
                <p class="mt-1 text-xl font-semibold tabular-nums">
                    {{ t('invoices.totalAmount') }}: {{ formatMoney(invoice.totalAmount) }}
                </p>
                <p v-if="invoice.revisionReason">
                    {{ t('invoices.revisionReason') }}: {{ invoice.revisionReason }}
                </p>
                <ul class="space-y-2">
                    <li v-for="(term, index) in invoice.terms" :key="index">
                        {{ term.label }}: {{ formatMoney(term.amount) }} /
                        {{ term.dueDate ?? t('invoices.noDueDate') }}
                    </li>
                </ul>
            </template>
        </template>
    </AppPanel>
    <InvoiceDocument
        v-if="!loading && !error && invoice && invoice.revisionNumber !== revisionNumber"
        :key="invoice.revisionNumber"
        :invoice="invoice"
    />
</template>
