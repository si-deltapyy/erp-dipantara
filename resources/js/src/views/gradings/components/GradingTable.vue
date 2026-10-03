<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AppTable from '@/components/ui/AppTable.vue'
import type { GradingRecord } from '@/core/types/grading'
import type { TableColumn } from '@/core/types/table'
defineProps<{ gradings: readonly GradingRecord[] }>()
const { t } = useI18n()
const columns = computed<readonly TableColumn<GradingRecord>[]>(() => [
    { key: 'purchaseOrderNumber', label: t('gradings.number') },
    { key: 'mitraName', label: t('gradings.mitra') },
    { key: 'graderGroup', label: t('gradings.graderGroup') },
    { key: 'productName', label: t('gradings.timberName') },
    { key: 'gradingDate', label: t('gradings.gradingDate') },
    { key: 'notes', label: t('gradings.notes') },
])
</script>
<template>
    <AppTable
        :rows="gradings"
        :columns="columns"
        :row-key="(grading) => grading.id"
        :caption="t('gradings.results')"
    >
        <template
            v-for="field in [
                'purchaseOrderNumber',
                'mitraName',
                'graderGroup',
                'productName',
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
