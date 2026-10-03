<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Assignment } from '@/core/types/assignment'
import type { TableColumn } from '@/core/types/table'
import AppTable from '@/components/ui/AppTable.vue'
import OrderStatus from '@/views/orders/components/OrderStatus.vue'
defineProps<{ assignments: readonly Assignment[]; state: 'ready' | 'loading' | 'error' }>()
defineEmits<{ retry: [] }>()
const { t } = useI18n()
const columns = computed<readonly TableColumn<Assignment>[]>(() => [
    { key: 'purchaseOrderNumber', label: t('orders.number') },
    { key: 'mitraName', label: t('assignments.mitra') },
    { key: 'graderName', label: t('assignments.grader') },
    { key: 'timberProductName', label: t('assignments.timber') },
    { key: 'quantity', label: t('assignments.quantity') },
    { key: 'orderStatus', label: t('assignments.orderStatus') },
])
</script>
<template>
    <AppTable
        :rows="assignments"
        :columns="columns"
        :row-key="(assignment) => assignment.id"
        :caption="t('assignments.assignedTitle')"
        :state="state"
        @retry="$emit('retry')"
    >
        <template #cell-purchaseOrderNumber="{ row }"
            ><RouterLink
                :to="{ name: 'assignment-detail', params: { id: row.id } }"
                class="block max-w-64 whitespace-normal break-words font-semibold text-primary"
                >{{ row.purchaseOrderNumber
                }}<span class="mt-1 block text-xs font-normal text-muted">{{
                    t('assignments.open')
                }}</span></RouterLink
            ></template
        >
        <template #cell-mitraName="{ row }"
            ><span class="block max-w-56 whitespace-normal break-words">{{
                row.mitraName
            }}</span></template
        >
        <template #cell-graderName="{ row }"
            ><span class="block max-w-56 whitespace-normal break-words">{{
                row.graderName
            }}</span></template
        >
        <template #cell-timberProductName="{ row }"
            ><span class="block max-w-56 whitespace-normal break-words">{{
                row.timberProductName
            }}</span></template
        >
        <template #cell-orderStatus="{ row }"><OrderStatus :status="row.orderStatus" /></template>
    </AppTable>
</template>
