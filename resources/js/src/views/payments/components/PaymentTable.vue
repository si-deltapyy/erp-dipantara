<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Payment } from '@/core/types/payment'
import type { TableColumn } from '@/core/types/table'
import { formatMoney } from '@/core/formatting/money'
import AppTable from '@/components/ui/AppTable.vue'
import AppStatusBadge from '@/components/ui/AppStatusBadge.vue'
defineProps<{ payments: readonly Payment[] }>()
const { t } = useI18n()
const columns = computed<readonly TableColumn<Payment>[]>(() => [
    { key: 'invoiceNumber', label: t('payments.invoice') },
    { key: 'counterpartyName', label: t('payments.counterparty') },
    { key: 'direction', label: t('payments.direction') },
    { key: 'paymentDate', label: t('payments.paymentDate') },
    { key: 'status', label: t('payments.status') },
    { key: 'creditAmount', label: t('payments.creditAmount') },
])
const statusTones = {
    draft: 'neutral',
    submitted: 'warning',
    approved: 'success',
    rejected: 'danger',
} as const
</script>
<template>
    <AppTable
        :rows="payments"
        :columns="columns"
        :row-key="(payment) => payment.id"
        :caption="t('payments.results')"
    >
        <template #cell-invoiceNumber="{ row }"
            ><RouterLink
                :to="{ name: 'payment-detail', params: { id: row.id }, query: $route.query }"
                class="inline-flex min-h-11 max-w-64 items-center whitespace-normal break-words font-semibold text-primary underline underline-offset-4"
                :aria-label="t('payments.open', { number: row.invoiceNumber })"
                >{{ row.invoiceNumber }}</RouterLink
            >
            <p class="text-xs text-muted">{{ row.purchaseOrderNumber }}</p></template
        >
        <template #cell-counterpartyName="{ row }"
            ><span class="block max-w-64 whitespace-normal break-words">{{
                row.counterpartyName
            }}</span></template
        >
        <template #cell-direction="{ row }">{{ t('payments.' + row.direction) }}</template>
        <template #cell-status="{ row }"
            ><AppStatusBadge :tone="statusTones[row.status]">{{
                t('payments.statuses.' + row.status)
            }}</AppStatusBadge></template
        >
        <template #cell-creditAmount="{ row }"
            ><span class="block text-right font-semibold tabular-nums">{{
                formatMoney(row.creditAmount)
            }}</span></template
        >
    </AppTable>
</template>
