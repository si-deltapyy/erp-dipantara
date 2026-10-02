<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ProductionRow } from '@/core/types/production'
import type { TableColumn } from '@/core/types/table'
import { formatVolume } from '@/core/formatting/volume'
import AppTable from '@/components/ui/AppTable.vue'
import AppState from '@/components/ui/AppState.vue'
defineProps<{ rows: readonly ProductionRow[] }>()
const { t } = useI18n()
const columns = computed<readonly TableColumn<ProductionRow>[]>(() => [
    { key: 'period', label: t('production.period') },
    { key: 'timberProductName', label: t('reports.timber') },
    { key: 'category', label: t('reports.category') },
    { key: 'quantity', label: t('reports.quantity') },
    { key: 'volumeM3', label: t('reports.volume') },
])
</script>
<template>
    <AppState v-if="!rows.length" kind="empty" :message="t('production.empty')" />
    <AppTable
        v-else
        :rows="rows"
        :columns="columns"
        :row-key="(row) => [row.period, row.timberProductId, row.category].join(':')"
        :caption="t('production.summary')"
    >
        <template #cell-timberProductName="{ row }"
            ><span class="block max-w-64 whitespace-normal break-words font-semibold">{{
                row.timberProductName
            }}</span></template
        >
        <template #cell-quantity="{ row }"
            ><span class="block text-right tabular-nums">{{ row.quantity }}</span></template
        >
        <template #cell-volumeM3="{ row }"
            ><span class="block text-right tabular-nums">{{
                formatVolume(row.volumeM3)
            }}</span></template
        >
    </AppTable>
</template>
