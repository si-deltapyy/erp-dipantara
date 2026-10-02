<script setup lang="ts">
import AppTable from '@/components/ui/AppTable.vue'

import { computed } from 'vue'
import type { TableColumn } from '@/core/types/table'
import { useI18n } from 'vue-i18n'
import type { AvailableTimber, DeliveryAllocation } from '@/core/types/delivery'
import AppNumberInput from '@/components/ui/AppNumberInput.vue'
const props = defineProps<{
    rows: readonly AvailableTimber[]
    allocations: readonly DeliveryAllocation[]
    errors?: Readonly<Record<string, string | undefined>>
    disabled: boolean
}>()
const emit = defineEmits<{ change: [allocations: readonly DeliveryAllocation[]] }>()
const { t } = useI18n()
function quantity(row: AvailableTimber): number {
    return (
        props.allocations.find(
            (allocation) =>
                allocation.gradingId === row.gradingId && allocation.rowId === row.rowId,
        )?.quantity ?? 0
    )
}
function update(row: AvailableTimber, value: number | null): void {
    const remaining = props.allocations.filter(
        (allocation) => allocation.gradingId !== row.gradingId || allocation.rowId !== row.rowId,
    )
    emit(
        'change',
        value === null || value === 0
            ? remaining
            : [
                  ...remaining,
                  { gradingId: row.gradingId, rowId: row.rowId, quantity: Number(value) },
              ],
    )
}
function rowError(row: AvailableTimber): string {
    const index = props.allocations.findIndex(
        (allocation) => allocation.gradingId === row.gradingId && allocation.rowId === row.rowId,
    )
    const error = props.errors?.[`allocations.${index}.quantity`]
    return error ? t(error) : ''
}
const columns = computed<readonly TableColumn<AvailableTimber>[]>(() => [
    { key: 'timberProductName', label: t('deliveries.timber') },
    { key: 'mitraName', label: t('deliveries.mitra') },
    { key: 'availableQuantity', label: t('deliveries.available') },
    { key: 'rowId', label: t('deliveries.quantity') },
])
</script>
<template>
    <AppTable
        :rows="rows"
        :columns="columns"
        :row-key="(row) => row.gradingId + ':' + row.rowId"
        :caption="t('deliveries.allocation')"
    >
        <template #cell-timberProductName="{ row }"
            ><span class="block max-w-64 whitespace-normal break-words">{{
                row.timberProductName
            }}</span></template
        >
        <template #cell-mitraName="{ row }"
            ><span class="block max-w-56 whitespace-normal break-words">{{
                row.mitraName
            }}</span></template
        >
        <template #cell-availableQuantity="{ row }"
            ><strong class="tabular-nums">{{ row.availableQuantity }}</strong>
            <p class="mt-1 text-xs text-muted">
                {{ t('deliveries.reserved') }}: {{ row.reservedQuantity }} /
                {{ t('deliveries.shipped') }}: {{ row.shippedQuantity }}
            </p></template
        >
        <template #cell-rowId="{ row }"
            ><div class="min-w-48 whitespace-normal">
                <AppNumberInput
                    :id="'allocation-' + row.gradingId + '-' + row.rowId"
                    :label="t('deliveries.quantity') + ' ? ' + row.timberProductName"
                    :model-value="quantity(row)"
                    :error="rowError(row)"
                    :disabled="disabled"
                    min="0"
                    :max="row.availableQuantity"
                    step="1"
                    @update:model-value="update(row, $event)"
                /></div
        ></template>
    </AppTable>
</template>
