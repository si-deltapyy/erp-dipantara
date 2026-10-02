<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { computed } from 'vue'
import { useSessionStore } from '@/stores/session'
import DashboardActivityList from './components/DashboardActivityList.vue'
import DashboardQueueCards from './components/DashboardQueueCards.vue'
import DashboardGraderPanel from './components/DashboardGraderPanel.vue'
import { useDashboardPeriod } from './composables/useDashboardPeriod'
import AppTextInput from '@/components/ui/AppTextInput.vue'
import { useDashboard } from './composables/useDashboard'
import DashboardMetricCard from './components/DashboardMetricCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppPageHeader from '@/components/ui/AppPageHeader.vue'
import AppPanel from '@/components/ui/AppPanel.vue'
import AppState from '@/components/ui/AppState.vue'
import { formatMoney } from '@/core/formatting/money'
const { t } = useI18n()
const session = useSessionStore()
const showGrader = computed(
    () =>
        session.user?.permissions.includes('dashboard.read.assigned') &&
        !session.user.permissions.includes('dashboard.read.all'),
)
const { period, error: periodError, applyPeriod } = useDashboardPeriod()
const showActivity = computed(
    () =>
        session.user?.permissions.includes('dashboard.read.own') &&
        !session.user.permissions.includes('dashboard.read.all'),
)
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
        <form
            v-if="showGrader"
            class="panel flex flex-wrap items-end gap-3"
            @submit.prevent="applyPeriod"
        >
            <AppTextInput
                id="dashboard-period"
                v-model="period"
                type="month"
                :label="t('production.period')"
                :error="periodError ? t(periodError) : undefined"
            />
            <AppButton type="submit">{{ t('production.apply') }}</AppButton>
        </form>
        <AppState v-if="loading" kind="loading" :message="t('dashboard.loading')" class="panel" />
        <div v-else-if="error" role="alert" class="panel space-y-3">
            <p>{{ t(error) }}</p>
            <AppButton @click="refresh">{{ t('dashboard.refresh') }}</AppButton>
        </div>
        <template v-else-if="snapshot">
            <p class="text-sm text-muted">
                {{ t('dashboard.asOf', { date: new Date(snapshot.asOf).toLocaleString('id-ID') }) }}
            </p>
            <p
                v-if="
                    !snapshot.metrics.length &&
                    !snapshot.queues.length &&
                    !showActivity &&
                    !snapshot.grader
                "
                role="status"
                class="panel"
            >
                {{ t('dashboard.empty') }}
            </p>
            <div class="grid gap-6 md:grid-cols-3">
                <DashboardMetricCard
                    v-for="metric in snapshot.metrics.filter((metric) => metric.unit === 'count')"
                    :key="metric.key"
                    :metric="metric"
                />
            </div>
            <div class="grid items-start gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
                <DashboardQueueCards :queues="snapshot.queues" />
                <AppPanel
                    v-if="snapshot.metrics.some((metric) => metric.unit === 'IDR')"
                    :title="t('overview.balances')"
                    :description="t('overview.balancesDescription')"
                >
                    <dl class="divide-y divide-line">
                        <div
                            v-for="metric in snapshot.metrics.filter(
                                (metric) => metric.unit === 'IDR',
                            )"
                            :key="metric.key"
                            class="py-5"
                        >
                            <dt class="text-sm text-muted">
                                {{ t('dashboard.metrics.' + metric.key) }}
                            </dt>
                            <dd class="mt-2 break-words text-2xl font-semibold">
                                <RouterLink :to="metric.targetPath">{{
                                    formatMoney(String(metric.value))
                                }}</RouterLink>
                            </dd>
                        </div>
                    </dl>
                    <template #footer>{{ t('overview.balanceNote') }}</template>
                </AppPanel>
            </div>
            <DashboardActivityList v-if="showActivity" :activity="snapshot.activity" />
            <DashboardGraderPanel v-if="snapshot.grader" :snapshot="snapshot.grader" />
        </template>
        <p v-else class="panel text-muted">{{ t('dashboard.unavailable') }}</p>
    </section>
</template>
