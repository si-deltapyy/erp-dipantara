<script setup lang="ts">
import DashboardSummaryCard from './DashboardSummaryCard.vue'
import { useI18n } from 'vue-i18n'
import type { DashboardMetric } from '@/core/types/dashboard'
import { formatMoney } from '@/core/formatting/money'
defineProps<{ metric: DashboardMetric }>()
const { t } = useI18n()
</script>
<template>
    <DashboardSummaryCard
        :title="t('dashboard.metrics.' + metric.key)"
        :value="
            metric.unit === 'IDR' ? formatMoney(metric.value) : metric.value.toLocaleString('id-ID')
        "
        :caption="t(metric.unit === 'IDR' ? 'dashboard.simulation' : 'dashboard.countUnit')"
        :target-path="metric.targetPath"
        :data-testid="'metric-' + metric.key"
    />
</template>
