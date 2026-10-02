<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AppTable from '@/components/ui/AppTable.vue'
import AppStatusBadge from '@/components/ui/AppStatusBadge.vue'
import type { Grading, GradingStatus } from '@/core/types/grading'
import type { TableColumn } from '@/core/types/table'
import { formatVolume } from '@/core/formatting/volume'

defineProps<{ gradings: readonly Grading[] }>()
const { t } = useI18n()
const columns = computed<readonly TableColumn<Grading>[]>(() => [
    { key: 'purchaseOrderNumber', label: t('gradings.number') },
    { key: 'mitraName', label: t('gradings.participants') },
    { key: 'gradingDate', label: t('gradings.gradingDate') },
    { key: 'status', label: t('gradings.status') },
    { key: 'totalVolumeM3', label: t('gradings.totalVolume') },
    { key: 'id', label: t('gradings.actions') },
])
const statusTones = {
    draft: 'neutral',
    submitted: 'warning',
    approved: 'success',
    rejected: 'danger',
    superseded: 'neutral',
} as const satisfies Record<GradingStatus, string>
</script>

<template>
    <AppTable
        :rows="gradings"
        :columns="columns"
        :row-key="(grading) => grading.id"
        :caption="t('gradings.results')"
    >
        <template #cell-purchaseOrderNumber="{ row }">
            <span class="block max-w-64 whitespace-normal break-words font-semibold">{{
                row.purchaseOrderNumber
            }}</span>
        </template>
        <template #cell-mitraName="{ row }">
            <div class="max-w-64 whitespace-normal break-words">
                <p class="font-medium">{{ row.mitraName }}</p>
                <p class="mt-1 text-xs text-muted">
                    {{ t('gradings.graderName', { name: row.graderName }) }}
                </p>
            </div>
        </template>
        <template #cell-status="{ row }">
            <AppStatusBadge :tone="statusTones[row.status]">{{
                t('gradings.statuses.' + row.status)
            }}</AppStatusBadge>
        </template>
        <template #cell-totalVolumeM3="{ row }">
            <span class="block text-right tabular-nums">{{ formatVolume(row.totalVolumeM3) }}</span>
        </template>
        <template #cell-id="{ row }">
            <RouterLink
                :to="{ name: 'grading-detail', params: { id: row.id } }"
                class="secondary-button"
                :aria-label="
                    t('gradings.openRecord', {
                        number: row.purchaseOrderNumber,
                        name: row.graderName,
                        date: row.gradingDate,
                    })
                "
                >{{ t('gradings.open') }}</RouterLink
            >
        </template>
    </AppTable>
</template>
