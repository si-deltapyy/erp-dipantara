<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Closing } from '@/core/types/closing'
import type { TableColumn } from '@/core/types/table'
import AppTable from '@/components/ui/AppTable.vue'
import AppStatusBadge from '@/components/ui/AppStatusBadge.vue'
defineProps<{ closings: readonly Closing[] }>()
const { t } = useI18n()
const columns = computed<readonly TableColumn<Closing>[]>(() => [
    { key: 'purchaseOrderNumber', label: t('closings.purchaseOrderNumber') },
    { key: 'status', label: t('closings.status') },
    { key: 'notes', label: t('closings.notes') },
])
</script>
<template>
    <AppTable
        :rows="closings"
        :columns="columns"
        :row-key="(closing) => closing.id"
        :caption="t('closings.results')"
    >
        <template #cell-purchaseOrderNumber="{ row }"
            ><RouterLink
                :to="{ name: 'closing-detail', params: { id: row.id }, query: $route.query }"
                class="inline-flex min-h-11 max-w-64 items-center whitespace-normal break-words font-semibold text-primary underline underline-offset-4"
                >{{ row.purchaseOrderNumber }}</RouterLink
            ></template
        >
        <template #cell-status="{ row }"
            ><AppStatusBadge
                :tone="
                    row.status === 'approved'
                        ? 'success'
                        : row.status === 'rejected'
                          ? 'danger'
                          : 'warning'
                "
                >{{ t('closings.statuses.' + row.status) }}</AppStatusBadge
            ></template
        >
        <template #cell-notes="{ row }"
            ><span class="block max-w-xl whitespace-normal break-words text-muted">{{
                row.notes ?? t('closings.noNotes')
            }}</span></template
        >
    </AppTable>
</template>
