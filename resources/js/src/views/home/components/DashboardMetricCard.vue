<script setup lang="ts">
import DashboardSummaryCard from './DashboardSummaryCard.vue'
import { useI18n } from 'vue-i18n'
import type { DashboardMetric } from '@/core/types/dashboard'
import { formatMoney } from '@/core/formatting/money'
defineProps<{ metric: DashboardMetric }>()
const { t } = useI18n()
const metricIcons = {
    'active-purchase-orders': 'document',
    'awaiting-deposit': 'clock',
    'in-progress': 'box',
    'awaiting-payment': 'calendar',
    receivables: 'invoice-in',
    payables: 'invoice-out',
    income: 'arrow-down',
    expenses: 'arrow-up',
    net: 'chart',
} as const satisfies Record<DashboardMetric['key'], string>
</script>
<template>
    <DashboardSummaryCard
        :title="t('dashboard.metrics.' + metric.key)"
        :value="
            metric.unit === 'IDR' ? formatMoney(metric.value) : metric.value.toLocaleString('id-ID')
        "
        :caption="t(metric.unit === 'IDR' ? 'dashboard.amountUnit' : 'dashboard.countUnit')"
        :icon="metricIcons[metric.key]"
        :data-testid="'metric-' + metric.key"
    />
</template>
