<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { InvoiceRecord } from '@/core/types/invoice'
import type { TableColumn } from '@/core/types/table'
import AppTable from '@/components/ui/AppTable.vue'
defineProps<{ invoices: readonly InvoiceRecord[] }>()
const { t } = useI18n()
const columns = computed<readonly TableColumn<InvoiceRecord>[]>(() => [
    { key: 'number', label: t('invoices.number') },
    { key: 'invoiceDate', label: t('invoices.invoiceDate') },
    { key: 'invoiceType', label: t('invoices.invoiceType') },
    { key: 'transactionId', label: t('invoices.transactionId') },
    { key: 'notes', label: t('invoices.notes') },
])
</script>
<template>
    <AppTable
        :rows="invoices"
        :columns="columns"
        :row-key="(invoice) => invoice.id"
        :caption="t('invoices.results')"
    >
        <template #cell-notes="{ row }"
            ><span class="block max-w-64 whitespace-normal break-words">{{
                row.notes ?? t('ui.unavailableValue')
            }}</span></template
        >
    </AppTable>
</template>
