<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { PaymentRecord } from '@/core/types/payment'
import type { TableColumn } from '@/core/types/table'
import { formatMoney } from '@/core/formatting/money'
import AppTable from '@/components/ui/AppTable.vue'
import AppStatusBadge from '@/components/ui/AppStatusBadge.vue'
defineProps<{ payments: readonly PaymentRecord[] }>()
const { t } = useI18n()
const columns = computed<readonly TableColumn<PaymentRecord>[]>(() => [
    { key: 'purchaseOrderNumber', label: t('payments.purchaseOrderNumber') },
    { key: 'buyerName', label: t('payments.buyer') },
    { key: 'paymentDate', label: t('payments.paymentDate') },
    { key: 'dueDate', label: t('payments.dueDate') },
    { key: 'buyerTerm', label: t('payments.buyerTerm') },
    { key: 'mitraTerm', label: t('payments.mitraTerm') },
    { key: 'status', label: t('payments.status') },
    { key: 'amount', label: t('payments.amount') },
])
const tones = { pending: 'warning', completed: 'success', cancelled: 'danger' } as const
</script>
<template>
    <AppTable
        :rows="payments"
        :columns="columns"
        :row-key="(payment) => payment.id"
        :caption="t('payments.results')"
    >
        <template
            v-for="field in ['purchaseOrderNumber', 'buyerName'] as const"
            #[`cell-${field}`]="{ row }"
        >
            {{ row[field] ?? t('ui.unavailableValue') }}
        </template>
        <template #cell-status="{ row }"
            ><AppStatusBadge :tone="tones[row.status]">{{
                t('payments.statuses.' + row.status)
            }}</AppStatusBadge></template
        >
        <template #cell-amount="{ row }"
            ><span class="block text-right tabular-nums">{{
                formatMoney(row.amount)
            }}</span></template
        >
    </AppTable>
</template>
