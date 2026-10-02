<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useDashboard } from './composables/useDashboard'
import DashboardMetricCard from './components/DashboardMetricCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppPageHeader from '@/components/ui/AppPageHeader.vue'
import AppPanel from '@/components/ui/AppPanel.vue'
import AppState from '@/components/ui/AppState.vue'
const { t } = useI18n()
const { record: snapshot, loading, error, refresh } = useDashboard()
</script>
<template>
    <section class="space-y-6">
        <AppPageHeader :title="t('dashboard.title')" :description="t('dashboard.description')">
            <template #actions>
                <AppButton variant="secondary" :pending="loading" @click="refresh">{{
                    t('dashboard.refresh')
                }}</AppButton>
            </template>
        </AppPageHeader>
        <AppState v-if="loading" kind="loading" :message="t('dashboard.loading')" class="panel" />
        <AppState
            v-else-if="error"
            kind="error"
            :message="t(error)"
            class="panel"
            @retry="refresh"
        />
        <template v-else-if="snapshot">
            <div class="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
                <DashboardMetricCard
                    v-for="metric in snapshot.metrics.filter((metric) => metric.unit === 'count')"
                    :key="metric.key"
                    :metric="metric"
                />
            </div>
            <div class="grid gap-6 md:grid-cols-2">
                <DashboardMetricCard
                    v-for="metric in snapshot.metrics.filter((metric) => metric.unit === 'IDR')"
                    :key="metric.key"
                    :metric="metric"
                />
            </div>
            <AppPanel
                :title="t('dashboard.cashflowTitle')"
                :description="t('dashboard.cashflowDescription')"
            >
                <div class="grid gap-6 md:grid-cols-3">
                    <DashboardMetricCard
                        v-for="metric in snapshot.cashflow"
                        :key="metric.key"
                        :metric="metric"
                    />
                </div>
            </AppPanel>
            <AppPanel :title="t('dashboard.detailsTitle')">
                <AppState kind="empty" :message="t('dashboard.detailsUnavailable')" />
            </AppPanel>
        </template>
        <p v-else class="panel text-muted">{{ t('dashboard.unavailable') }}</p>
    </section>
</template>
