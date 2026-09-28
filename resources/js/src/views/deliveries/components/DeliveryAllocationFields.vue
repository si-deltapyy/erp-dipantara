<script setup lang="ts">
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
</script>
<template>
    <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
            <caption class="sr-only">
                {{
                    t('deliveries.allocation')
                }}
            </caption>
            <thead>
                <tr class="border-b border-line">
                    <th scope="col" class="p-3">{{ t('deliveries.timber') }}</th>
                    <th scope="col" class="p-3">{{ t('deliveries.mitra') }}</th>
                    <th scope="col" class="p-3">{{ t('deliveries.available') }}</th>
                    <th scope="col" class="p-3">{{ t('deliveries.quantity') }}</th>
                </tr>
            </thead>
            <tbody>
                <tr
                    v-for="row in rows"
                    :key="row.gradingId + ':' + row.rowId"
                    class="border-b border-line"
                >
                    <td class="min-w-40 p-3">{{ row.timberProductName }}</td>
                    <td class="min-w-36 p-3">{{ row.mitraName }}</td>
                    <td class="min-w-44 p-3">
                        <strong>{{ row.availableQuantity }}</strong>
                        <p class="text-xs text-muted">
                            {{ t('deliveries.reserved') }}: {{ row.reservedQuantity }} ·
                            {{ t('deliveries.shipped') }}: {{ row.shippedQuantity }}
                        </p>
                    </td>
                    <td class="min-w-48 p-3">
                        <AppNumberInput
                            :id="'allocation-' + row.gradingId + '-' + row.rowId"
                            :label="t('deliveries.quantity') + ' — ' + row.timberProductName"
                            :model-value="quantity(row)"
                            :error="rowError(row)"
                            :disabled="disabled"
                            min="0"
                            :max="row.availableQuantity"
                            step="1"
                            @update:model-value="update(row, $event)"
                        />
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>
