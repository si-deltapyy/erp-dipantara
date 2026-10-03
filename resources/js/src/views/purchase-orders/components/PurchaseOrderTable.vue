<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { PurchaseOrderRecord } from '@/core/types/purchase-order'
import type { TableColumn } from '@/core/types/table'
import AppTable from '@/components/ui/AppTable.vue'
import PurchaseOrderStatus from './PurchaseOrderStatus.vue'
import { formatPurchaseOrderMoney } from '../purchase-order-format'
defineProps<{ orders: readonly PurchaseOrderRecord[] }>()
const { t } = useI18n()
const columns = computed<readonly TableColumn<PurchaseOrderRecord>[]>(() => [
    { key: 'buyerName', label: t('purchase-orders.buyer') },
    { key: 'number', label: t('purchase-orders.number') },
    { key: 'orderDate', label: t('purchase-orders.orderDate') },
    { key: 'status', label: t('purchase-orders.status') },
    { key: 'totalAmount', label: t('purchase-orders.totalAmount') },
    { key: 'productName', label: t('purchase-orders.material') },
    { key: 'quantity', label: t('purchase-orders.quantityHeading') },
    { key: 'closingDate', label: t('purchase-orders.closingDate') },
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
                row.buyerName ?? t('ui.unavailableValue')
            }}</span></template
        >
        <template #cell-number="{ row }"
            ><RouterLink
                :to="{ name: 'purchase-order-detail', params: { id: row.id }, query: $route.query }"
                class="block max-w-48 whitespace-normal break-words text-primary hover:underline"
                >{{ row.number }}</RouterLink
            ></template
        >
        <template #cell-status="{ row }"><PurchaseOrderStatus :status="row.status" /></template>
        <template #cell-totalAmount="{ row }">{{
            row.totalAmount === null
                ? t('ui.unavailableValue')
                : formatPurchaseOrderMoney(row.totalAmount)
        }}</template>
        <template #cell-productName="{ row }">{{
            row.productName ?? t('ui.unavailableValue')
        }}</template>
    </AppTable>
</template>
