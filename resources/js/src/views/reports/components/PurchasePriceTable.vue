<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { PurchasePriceRow } from '@/core/types/purchase-price-report'
import type { TableColumn } from '@/core/types/table'
import AppTable from '@/components/ui/AppTable.vue'
import { formatVolume } from '@/core/formatting/volume'
import { formatPurchaseOrderMoney } from '@/views/purchase-orders/purchase-order-format'
defineProps<{ rows: readonly PurchasePriceRow[] }>()
const { t } = useI18n()
const columns = computed<readonly TableColumn<PurchasePriceRow>[]>(() => [
    { key: 'purchaseOrderNumber', label: t('purchase-orders.number') },
    { key: 'mitraName', label: t('mitras.title') },
    { key: 'timberProductName', label: t('timber-products.title') },
    { key: 'category', label: t('reports.category') },
    { key: 'quantity', label: t('reports.quantity') },
    { key: 'volumeM3', label: t('reports.volume') },
    { key: 'unitPrice', label: t('reports.unitPrice') },
    { key: 'totalAmount', label: t('reports.subtotal') },
    { key: 'sourceStatus', label: t('reports.source') },
])
</script>
<template>
    <p v-if="!rows.length" role="status">{{ t('production.empty') }}</p>
    <AppTable
        v-else
        :rows="rows"
        :columns="columns"
        :row-key="
            (row) => [row.purchaseOrderId, row.mitraId, row.timberProductId, row.category].join(':')
        "
        :caption="t('reports.prices')"
    >
        <template #cell-volumeM3="{ row }">{{ formatVolume(row.volumeM3) }}</template>
        <template #cell-unitPrice="{ row }">{{
            row.unitPrice === null
                ? t('reports.unavailable')
                : formatPurchaseOrderMoney(row.unitPrice)
        }}</template>
        <template #cell-totalAmount="{ row }">{{
            row.totalAmount === null
                ? t('reports.unavailable')
                : formatPurchaseOrderMoney(row.totalAmount)
        }}</template>
        <template #cell-sourceStatus="{ row }"
            ><span>{{ t('reports.' + row.sourceStatus) }}</span
            ><span v-if="row.priceBasis && row.priceAsOf" class="block"
                >{{ t('reports.' + row.priceBasis) }} / {{ row.priceAsOf }}</span
            ></template
        >
    </AppTable>
</template>
