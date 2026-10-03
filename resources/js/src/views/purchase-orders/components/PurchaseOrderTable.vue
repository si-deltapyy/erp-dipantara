<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { PurchaseOrder } from '@/core/types/purchase-order'
import type { TableColumn } from '@/core/types/table'
import AppTable from '@/components/ui/AppTable.vue'
import PurchaseOrderStatus from './PurchaseOrderStatus.vue'
import { formatPurchaseOrderMoney } from '../purchase-order-format'
defineProps<{ orders: readonly PurchaseOrder[] }>()
const { t } = useI18n()
const columns = computed<readonly TableColumn<PurchaseOrder>[]>(() => [
    { key: 'buyerName', label: t('purchase-orders.buyer') },
    { key: 'number', label: t('purchase-orders.number') },
    { key: 'orderDate', label: t('purchase-orders.orderDate') },
    { key: 'status', label: t('purchase-orders.status') },
    { key: 'totalAmount', label: t('purchase-orders.totalAmount') },
    { key: 'allowedActions', label: t('purchase-orders.actions') },
])
</script>
<template>
    <AppTable
        :rows="orders"
        :columns="columns"
        :row-key="(order) => order.id"
        :caption="t('purchase-orders.title')"
    >
        <template #cell-buyerName="{ row }"
            ><span class="block min-w-40 max-w-64 whitespace-normal break-words font-semibold">{{
                row.buyerName
            }}</span></template
        >
        <template #cell-number="{ row }"
            ><span class="block max-w-48 whitespace-normal break-words">{{
                row.number
            }}</span></template
        >
        <template #cell-status="{ row }"><PurchaseOrderStatus :status="row.status" /></template>
        <template #cell-totalAmount="{ row }">{{
            formatPurchaseOrderMoney(row.totalAmount)
        }}</template>
        <template #cell-allowedActions="{ row }"
            ><RouterLink
                :to="{ name: 'purchase-order-detail', params: { id: row.id }, query: $route.query }"
                class="secondary-button"
                :aria-label="t('purchase-orders.open', { number: row.number })"
                >{{ t('purchase-orders.detail') }}</RouterLink
            ></template
        >
    </AppTable>
</template>
