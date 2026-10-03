<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { DashboardWorkRow, DashboardWorkStatus } from '@/core/types/dashboard-overview'
import type { TableColumn } from '@/core/types/table'
import AppPanel from '@/components/ui/AppPanel.vue'
import AppTable from '@/components/ui/AppTable.vue'
import AppStatusBadge from '@/components/ui/AppStatusBadge.vue'
import AppTextInput from '@/components/ui/AppTextInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppPagination from '@/components/ui/AppPagination.vue'

defineProps<{
    rows: readonly DashboardWorkRow[]
    search: string
    status: string
    total: number
    page: number
    pageSize: number
}>()
defineEmits<{
    'update:search': [value: string]
    'update:status': [value: string]
    'update:page': [value: number]
    inspect: [row: DashboardWorkRow]
    reset: []
}>()
const { t } = useI18n()
const columns = computed<readonly TableColumn<DashboardWorkRow>[]>(() => [
    { key: 'id', label: t('overview.id') },
    { key: 'buyer', label: t('overview.buyer') },
    { key: 'status', label: t('overview.status') },
])
const options = computed(() =>
    ['all', 'review', 'preparing', 'shipping', 'payment'].map((value) => ({
        value,
        label: t(`overview.${value}`),
    })),
)
const tones: Record<DashboardWorkStatus, 'warning' | 'neutral' | 'info' | 'success'> = {
    review: 'warning',
    preparing: 'neutral',
    shipping: 'info',
    payment: 'success',
}
</script>

<template>
    <AppPanel
        :title="t('overview.priorities')"
        :description="t('overview.priorityDescription')"
        class="wf-priorities"
    >
        <template #actions
            ><span class="wf-count">{{ total }}</span></template
        >
        <div class="wf-table-controls">
            <div class="wf-search">
                <AppIcon name="search" :size="17" /><AppTextInput
                    id="priority-search"
                    :label="t('overview.search')"
                    :model-value="search"
                    :placeholder="t('overview.searchPlaceholder')"
                    @update:model-value="$emit('update:search', $event)"
                />
            </div>
            <AppSelect
                id="priority-status"
                renderer="nice"
                :label="t('overview.status')"
                :model-value="status"
                :options="options"
                @update:model-value="$emit('update:status', $event)"
            />
        </div>
        <AppTable
            :rows="rows"
            :columns="columns"
            :row-key="(row) => row.id"
            :caption="t('overview.priorities')"
        >
            <template #cell-id="{ row }"
                ><button type="button" class="wf-order-link" @click="$emit('inspect', row)">
                    {{ row.id }}<AppIcon name="chevron" :size="12" /></button
                ><span class="wf-row-secondary" :class="{ 'wf-overdue': row.overdue }">{{
                    row.overdue ? t('overview.overdue') : row.dueDate
                }}</span></template
            >
            <template #cell-buyer="{ row }"
                ><div class="wf-buyer">
                    <span class="wf-buyer-avatar">{{ row.initials }}</span>
                    <div>
                        <strong>{{ row.buyer }}</strong
                        ><span class="wf-row-secondary">{{ row.timber }}</span>
                    </div>
                </div></template
            >
            <template #cell-status="{ row }"
                ><AppStatusBadge :tone="tones[row.status]">{{
                    t(`overview.${row.status}`)
                }}</AppStatusBadge></template
            >
        </AppTable>
        <template #footer
            ><AppPagination
                numbered
                :page="page"
                :page-size="pageSize"
                :total="total"
                @update:page="$emit('update:page', $event)"
            /><AppButton
                v-if="search || status !== 'all'"
                variant="secondary"
                @click="$emit('reset')"
                >{{ t('overview.reset') }}</AppButton
            ></template
        >
    </AppPanel>
</template>
