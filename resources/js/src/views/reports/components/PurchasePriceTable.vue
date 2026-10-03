<script setup lang="ts">
import AppState from '@/components/ui/AppState.vue'
import AppStatusBadge from '@/components/ui/AppStatusBadge.vue'

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
    <AppState v-if="!rows.length" kind="empty" :message="t('production.empty')" />
    <AppTable
        v-else
        :rows="rows"
        :columns="columns"
        :row-key="
            (row) => [row.purchaseOrderId, row.mitraId, row.timberProductId, row.category].join(':')
        "
        :caption="t('reports.prices')"
    >
        <template #cell-mitraName="{ row }"
            ><span class="block max-w-64 whitespace-normal break-words">{{
                row.mitraName
            }}</span></template
        >
        <template #cell-timberProductName="{ row }"
            ><span class="block max-w-64 whitespace-normal break-words">{{
                row.timberProductName
            }}</span></template
        >
        <template #cell-volumeM3="{ row }"
            ><span class="block text-right tabular-nums">{{
                formatVolume(row.volumeM3)
            }}</span></template
        >
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
            ><AppStatusBadge
                :tone="row.sourceStatus === 'missing_snapshot' ? 'warning' : 'neutral'"
                >{{ t('reports.' + row.sourceStatus) }}</AppStatusBadge
            ><span v-if="row.priceBasis && row.priceAsOf" class="block"
                >{{ t('reports.' + row.priceBasis) }} / {{ row.priceAsOf }}</span
            ></template
        >
    </AppTable>
</template>
