<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Invoice } from '@/core/types/invoice'
import type { TableColumn } from '@/core/types/table'
import { formatMoney } from '@/core/formatting/money'
import AppTable from '@/components/ui/AppTable.vue'
import AppStatusBadge from '@/components/ui/AppStatusBadge.vue'
defineProps<{ invoices: readonly Invoice[] }>()
const { t } = useI18n()
const columns = computed<readonly TableColumn<Invoice>[]>(() => [
    { key: 'number', label: t('invoices.number') },
    { key: 'counterpartyName', label: t('invoices.counterparty') },
    { key: 'direction', label: t('invoices.direction') },
    { key: 'status', label: t('invoices.status') },
    { key: 'totalAmount', label: t('invoices.totalAmount') },
    { key: 'outstandingAmount', label: t('invoices.outstandingAmount') },
])
</script>
<template>
    <AppTable
        :rows="invoices"
        :columns="columns"
        :row-key="(invoice) => invoice.id"
        :caption="t('invoices.results')"
    >
        <template #cell-number="{ row }"
            ><RouterLink
                :to="{ name: 'invoice-detail', params: { id: row.id }, query: $route.query }"
                class="inline-flex min-h-11 max-w-64 items-center whitespace-normal break-words font-semibold text-primary underline underline-offset-4"
                :aria-label="t('invoices.open', { number: row.number ?? row.purchaseOrderNumber })"
                >{{ row.number ?? row.purchaseOrderNumber }}</RouterLink
            >
            <p class="text-xs text-muted">{{ row.purchaseOrderNumber }}</p></template
        >
        <template #cell-counterpartyName="{ row }"
            ><span class="block max-w-64 whitespace-normal break-words">{{
                row.counterpartyName
            }}</span></template
        >
        <template #cell-direction="{ row }">{{ t('invoices.' + row.direction) }}</template>
        <template #cell-status="{ row }"
            ><AppStatusBadge :tone="row.status === 'issued' ? 'success' : 'neutral'">{{
                t('invoices.statuses.' + row.status)
            }}</AppStatusBadge>
            <p
                v-if="row.status === 'draft' && row.issuedRevisionNumber"
                class="mt-2 text-xs text-muted"
            >
                {{ t('invoices.draftRevision') }}
            </p></template
        >
        <template #cell-totalAmount="{ row }"
            ><span class="block text-right tabular-nums">{{
                formatMoney(row.totalAmount)
            }}</span></template
        >
        <template #cell-outstandingAmount="{ row }"
            ><span class="block text-right tabular-nums">{{
                row.issuedRevisionNumber
                    ? formatMoney(row.outstandingAmount)
                    : t('invoices.notIssued')
            }}</span></template
        >
    </AppTable>
</template>
