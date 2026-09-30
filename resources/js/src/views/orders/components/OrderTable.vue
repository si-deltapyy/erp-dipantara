<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Order } from '@/core/types/order'
import type { TableColumn } from '@/core/types/table'
import AppTable from '@/components/ui/AppTable.vue'
defineProps<{ orders: readonly Order[] }>()
const { t } = useI18n()
const columns = computed<readonly TableColumn<Order>[]>(() => [
    { key: 'buyerName', label: t('orders.buyer') },
    { key: 'purchaseOrderNumber', label: t('orders.number') },
    { key: 'status', label: t('orders.status') },
    { key: 'notes', label: t('orders.dp') },
    { key: 'allowedActions', label: t('orders.actions') },
])
</script>
<template>
    <AppTable
        :rows="orders"
        :columns="columns"
        :row-key="(order) => order.id"
        :caption="t('orders.title')"
    >
        <template #cell-buyerName="{ row }"
            ><span class="block min-w-40 max-w-64 whitespace-normal break-words font-semibold">{{
                row.buyerName
            }}</span></template
        >
        <template #cell-purchaseOrderNumber="{ row }"
            ><span class="block max-w-48 whitespace-normal break-words">{{
                row.purchaseOrderNumber
            }}</span></template
        >
        <template #cell-status="{ row }">{{ t('orders.statuses.' + row.status) }}</template>
        <template #cell-notes>{{ t('orders.dpUnavailable') }}</template>
        <template #cell-allowedActions="{ row }"
            ><RouterLink
                :to="{ name: 'order-detail', params: { id: row.id }, query: $route.query }"
                class="secondary-button"
                :aria-label="t('orders.open', { number: row.purchaseOrderNumber })"
                >{{ t('orders.detail') }}</RouterLink
            ></template
        >
    </AppTable>
</template>
