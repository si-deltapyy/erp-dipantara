<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Grading, GradingRow } from '@/core/types/grading'
import type { TableColumn } from '@/core/types/table'
import { formatVolume } from '@/core/formatting/volume'
import AppTable from '@/components/ui/AppTable.vue'

const props = defineProps<{ grading: Grading }>()
const { t } = useI18n()
interface MeasurementRow extends GradingRow {
    readonly timberName: string
    readonly volume: string | null
}
const rows = computed<readonly MeasurementRow[]>(() =>
    props.grading.rows.map((row) => {
        const result = props.grading.rowResults.find((result) => result.rowId === row.rowId)
        return {
            ...row,
            timberName: result?.timberProductName ?? t('gradings.unavailable'),
            volume: result?.volumeM3 ?? null,
        }
    }),
)
const columns = computed<readonly TableColumn<MeasurementRow>[]>(() => [
    { key: 'timberName', label: t('gradings.timberName') },
    { key: 'quantity', label: t('gradings.quantity') },
    { key: 'diameterCm', label: t('gradings.diameter') },
    { key: 'lengthM', label: t('gradings.length') },
    { key: 'gradeCode', label: t('gradings.grade') },
    { key: 'volume', label: t('gradings.volume') },
])
</script>
<template>
    <div class="min-w-0 space-y-5">
        <dl class="flex flex-wrap justify-between gap-5">
            <div>
                <dt class="text-sm text-muted">{{ t('gradings.gradingDate') }}</dt>
                <dd class="mt-1 font-semibold">{{ grading.gradingDate }}</dd>
            </div>
            <div>
                <dt class="text-sm text-muted">{{ t('gradings.totalVolume') }}</dt>
                <dd class="mt-1 text-xl font-semibold tabular-nums">
                    {{ formatVolume(grading.totalVolumeM3) }}
                </dd>
            </div>
        </dl>
        <AppTable
            :rows="rows"
            :columns="columns"
            :row-key="(row) => row.rowId"
            :caption="t('gradings.measurements')"
        >
            <template #cell-timberName="{ row }"
                ><span class="block max-w-64 whitespace-normal break-words">{{
                    row.timberName
                }}</span></template
            >
            <template #cell-volume="{ row }"
                ><span class="tabular-nums">{{
                    row.volume === null ? t('gradings.unavailable') : formatVolume(row.volume)
                }}</span></template
            >
        </AppTable>
    </div>
</template>
