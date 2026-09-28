<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { DashboardMetric } from '@/core/types/dashboard'
import { formatMoney } from '@/core/formatting/money'
defineProps<{ metric: DashboardMetric }>()
const { t } = useI18n()
</script>
<template>
    <RouterLink
        :to="metric.targetPath"
        class="panel block min-w-0 space-y-4 transition-shadow hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
        :data-testid="'metric-' + metric.key"
    >
        <h2 class="text-sm font-semibold text-muted">{{ t('dashboard.metrics.' + metric.key) }}</h2>
        <p class="break-words text-2xl font-bold tracking-tight">
            {{
                metric.unit === 'IDR'
                    ? formatMoney(metric.value)
                    : metric.value.toLocaleString('id-ID')
            }}
        </p>
        <p class="text-xs text-muted">
            {{ t(metric.unit === 'IDR' ? 'dashboard.simulation' : 'dashboard.countUnit') }}
        </p>
        <p class="text-sm font-semibold text-primary">
            {{ t('dashboard.openList') }} <span aria-hidden="true">&rarr;</span>
        </p>
    </RouterLink>
</template>
