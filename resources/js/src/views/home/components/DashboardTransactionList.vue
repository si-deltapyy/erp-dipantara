<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { DashboardActivity } from '@/core/types/dashboard-activity'
import type { DashboardQueueEntry } from '@/core/types/dashboard-queue'
import type { TableColumn } from '@/core/types/table'
import AppTable from '@/components/ui/AppTable.vue'
import AppStatusBadge from '@/components/ui/AppStatusBadge.vue'
type DashboardTransaction = DashboardActivity | DashboardQueueEntry
defineProps<{ records: readonly DashboardTransaction[] }>()
const { t } = useI18n()
const columns = computed<readonly TableColumn<DashboardTransaction>[]>(() => [
    { key: 'label', label: t('overview.priorities') },
    { key: 'purchaseOrderNumber', label: t('overview.id') },
    { key: 'status', label: t('overview.status') },
    { key: 'updatedAt', label: t('dashboard.updatedAt') },
])
</script>
<template>
    <AppTable
        :rows="records"
        :columns="columns"
        :row-key="(record) => record.resource + ':' + record.id"
        :caption="t('dashboard.queueTitle')"
    >
        <template #cell-label="{ row }">
            <RouterLink
                :to="row.targetPath"
                class="block max-w-72 whitespace-normal break-words font-semibold text-primary"
                >{{ row.label }}</RouterLink
            >
            <span class="text-xs text-muted">{{ t('dashboard.resources.' + row.resource) }}</span>
        </template>
        <template #cell-status="{ row }"
            ><AppStatusBadge
                :tone="
                    row.status === 'rejected'
                        ? 'danger'
                        : ['approved', 'received', 'closed'].includes(row.status)
                          ? 'success'
                          : ['submitted', 'requested'].includes(row.status)
                            ? 'warning'
                            : 'neutral'
                "
                >{{ t('dashboard.statuses.' + row.status) }}</AppStatusBadge
            ></template
        >
        <template #cell-updatedAt="{ row }"
            ><time :datetime="row.updatedAt">{{
                new Date(row.updatedAt).toLocaleString('id-ID')
            }}</time></template
        >
    </AppTable>
</template>
