<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { OrderRecord } from '@/core/types/order'
import type { TableColumn } from '@/core/types/table'
import AppTable from '@/components/ui/AppTable.vue'
defineProps<{ orders: readonly OrderRecord[] }>()
const { t } = useI18n()
const columns = computed<readonly TableColumn<OrderRecord>[]>(() => [
    { key: 'buyerName', label: t('orders.buyer') },
    { key: 'number', label: t('orders.orderNumber') },
    { key: 'purchaseOrderNumber', label: t('orders.number') },
    { key: 'orderDate', label: t('orders.orderDate') },
    { key: 'mitraName', label: t('orders.mitra') },
    { key: 'graderName', label: t('orders.grader') },
    { key: 'buyerGraderName', label: t('orders.buyerGrader') },
    { key: 'notes', label: t('orders.notes') },
])
</script>
<template>
    <AppTable
        :rows="orders"
        :columns="columns"
        :row-key="(order) => order.id"
        :caption="t('orders.title')"
    >
        <template
            v-for="field in [
                'buyerName',
                'purchaseOrderNumber',
                'mitraName',
                'graderName',
                'notes',
            ] as const"
            :key="field"
            #[`cell-${field}`]="{ row }"
        >
            <span class="block max-w-64 whitespace-normal break-words">{{
                row[field] ?? t('ui.unavailableValue')
            }}</span>
        </template>
    </AppTable>
</template>
