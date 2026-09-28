<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { computed } from 'vue'
import { useSessionStore } from '@/stores/session'
import DashboardActivityList from './components/DashboardActivityList.vue'
import { useDashboard } from './composables/useDashboard'
import DashboardMetricCard from './components/DashboardMetricCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
const { t } = useI18n()
const session = useSessionStore()
const showActivity = computed(
    () =>
        session.user?.permissions.includes('dashboard.read.own') &&
        !session.user.permissions.includes('dashboard.read.all'),
)
const { record: snapshot, loading, error, refresh } = useDashboard()
</script>
<template>
    <section class="space-y-6">
        <header class="flex flex-wrap items-start justify-between gap-4">
            <div class="max-w-2xl">
                <p class="text-sm font-semibold text-primary">{{ t('dashboard.title') }}</p>
                <h1 class="mt-1 text-2xl font-bold">{{ t('home.title') }}</h1>
                <p class="mt-2 text-sm leading-6 text-muted">{{ t('dashboard.description') }}</p>
            </div>
            <AppButton variant="secondary" :pending="loading" @click="refresh">{{
                t('dashboard.refresh')
            }}</AppButton>
        </header>
        <p v-if="loading" role="status" class="panel">{{ t('dashboard.loading') }}</p>
        <div v-else-if="error" role="alert" class="panel space-y-3">
            <p>{{ t(error) }}</p>
            <AppButton @click="refresh">{{ t('dashboard.refresh') }}</AppButton>
        </div>
        <template v-else-if="snapshot">
            <p class="text-sm text-muted">
                {{ t('dashboard.asOf', { date: new Date(snapshot.asOf).toLocaleString('id-ID') }) }}
            </p>
            <p v-if="!snapshot.metrics.length && !showActivity" role="status" class="panel">
                {{ t('dashboard.empty') }}
            </p>
            <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <DashboardMetricCard
                    v-for="metric in snapshot.metrics"
                    :key="metric.key"
                    :metric="metric"
                />
            </div>
            <DashboardActivityList v-if="showActivity" :activity="snapshot.activity" />
        </template>
        <p v-else class="panel text-muted">{{ t('dashboard.unavailable') }}</p>
    </section>
</template>
