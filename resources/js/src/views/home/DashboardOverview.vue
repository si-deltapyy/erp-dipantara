<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type {
    DashboardBalance,
    DashboardOverviewMetric,
    DashboardTimelineEntry,
    DashboardWorkQueue,
    DashboardWorkRow,
    DashboardWorkStatus,
} from '@/core/types/dashboard-overview'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import OperationalMetrics from './components/OperationalMetrics.vue'
import PriorityWorkTable from './components/PriorityWorkTable.vue'
import OutstandingBalances from './components/OutstandingBalances.vue'
import WorkQueueDistribution from './components/WorkQueueDistribution.vue'
import OperationsTimeline from './components/OperationsTimeline.vue'

defineProps<{
    period: string
    periods: readonly { value: string; label: string }[]
    metrics: readonly DashboardOverviewMetric[]
    rows: readonly DashboardWorkRow[]
    total: number
    balances: readonly DashboardBalance[]
    queues: readonly DashboardWorkQueue[]
    activities: readonly DashboardTimelineEntry[]
    search: string
    status: string
    selectedMetric?: string
    page: number
    pageSize: number
}>()
defineEmits<{
    'update:period': [value: string]
    'update:search': [value: string]
    'update:status': [value: string]
    'update:page': [value: number]
    metric: [key: DashboardOverviewMetric['key']]
    queue: [status: DashboardWorkStatus]
    inspect: [row: DashboardWorkRow]
    reset: []
}>()
const { t } = useI18n()
</script>

<template>
    <div class="wf-dashboard">
        <header class="wf-page-heading">
            <div>
                <h1>{{ t('overview.title') }}</h1>
                <p>{{ t('overview.description') }}</p>
            </div>
            <div class="wf-period">
                <AppIcon name="calendar" :size="18" /><AppSelect
                    id="dashboard-period"
                    renderer="nice"
                    :label="t('overview.period')"
                    :model-value="period"
                    :options="periods"
                    @update:model-value="$emit('update:period', $event)"
                />
            </div>
        </header>
        <OperationalMetrics
            :metrics="metrics"
            :selected="selectedMetric"
            @select="$emit('metric', $event)"
        />
        <div class="wf-dashboard-grid">
            <PriorityWorkTable
                :rows="rows"
                :search="search"
                :status="status"
                :total="total"
                :page="page"
                :page-size="pageSize"
                @update:search="$emit('update:search', $event)"
                @update:status="$emit('update:status', $event)"
                @update:page="$emit('update:page', $event)"
                @inspect="$emit('inspect', $event)"
                @reset="$emit('reset')"
            /><OutstandingBalances :balances="balances" />
        </div>
        <div class="wf-dashboard-bottom">
            <WorkQueueDistribution
                :queues="queues"
                :selected="status"
                @select="$emit('queue', $event)"
            /><OperationsTimeline :entries="activities" />
        </div>
    </div>
</template>
