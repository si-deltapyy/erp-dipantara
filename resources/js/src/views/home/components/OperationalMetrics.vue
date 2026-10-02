<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { DashboardOverviewMetric } from '@/core/types/dashboard-overview'
import AppIcon from '@/components/ui/AppIcon.vue'

defineProps<{ metrics: readonly DashboardOverviewMetric[]; selected?: string }>()
defineEmits<{ select: [key: DashboardOverviewMetric['key']] }>()
const { t } = useI18n()
const icons = { active: 'document', prepared: 'box', dispatched: 'truck' } as const
</script>

<template>
    <div class="wf-metrics">
        <button
            v-for="metric in metrics"
            :key="metric.key"
            type="button"
            class="panel wf-metric"
            :class="{ 'wf-metric--selected': selected === metric.key }"
            :aria-pressed="selected === metric.key"
            @click="$emit('select', metric.key)"
        >
            <div class="wf-metric-heading">
                <span>{{ t(`overview.${metric.key}`) }}</span>
                <span class="wf-metric-icon"><AppIcon :name="icons[metric.key]" :size="32" /></span>
            </div>
            <div class="wf-metric-value">
                <strong>{{ metric.value.toLocaleString('id-ID') }}</strong>
            </div>
            <p>{{ metric.note }}</p>
        </button>
    </div>
</template>
