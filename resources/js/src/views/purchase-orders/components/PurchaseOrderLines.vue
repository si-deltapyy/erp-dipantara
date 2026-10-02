<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { PurchaseOrder } from '@/core/types/purchase-order'
import type { TableColumn } from '@/core/types/table'
import AppTable from '@/components/ui/AppTable.vue'
import AppPanel from '@/components/ui/AppPanel.vue'
import { formatPurchaseOrderMoney } from '../purchase-order-format'
type PurchaseOrderLine = PurchaseOrder['lines'][number]
const props = defineProps<{ lines: PurchaseOrder['lines'] }>()
const { t } = useI18n()
const rows = computed(() => props.lines.map((line, index) => ({ ...line, key: String(index) })))
const columns = computed<readonly TableColumn<PurchaseOrderLine>[]>(() => [
    { key: 'timberProductName', label: t('purchase-orders.material') },
    { key: 'quantity', label: t('purchase-orders.quantityHeading') },
    { key: 'unitPrice', label: t('purchase-orders.priceHeading') },
])
</script>
<template>
    <AppPanel :title="t('purchase-orders.lines')">
        <AppTable
            :rows="rows"
            :columns="columns"
            :row-key="(line) => line.key"
            :caption="t('purchase-orders.lines')"
        >
            <template #cell-timberProductName="{ row }"
                ><span class="block max-w-80 whitespace-normal break-words font-semibold">{{
                    row.timberProductName
                }}</span></template
            >
            <template #cell-unitPrice="{ row }">{{
                formatPurchaseOrderMoney(row.unitPrice)
            }}</template>
        </AppTable>
    </AppPanel>
</template>
