<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { DashboardQueueSummary } from '@/core/types/dashboard-queue'
import DashboardSummaryCard from './DashboardSummaryCard.vue'
defineProps<{ queues: readonly DashboardQueueSummary[] }>()
const { t } = useI18n()
</script>
<template>
    <section v-if="queues.length" class="space-y-4" aria-labelledby="dashboard-queues-title">
        <h2 id="dashboard-queues-title" class="text-lg font-bold">
            {{ t('dashboard.queueTitle') }}
        </h2>
        <p class="text-sm text-muted">{{ t('dashboard.queueDescription') }}</p>
        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <DashboardSummaryCard
                v-for="queue in queues"
                :key="queue.kind"
                :title="t('dashboard.queues.' + queue.kind)"
                :value="queue.count.toLocaleString('id-ID')"
                :caption="t('dashboard.queueCount')"
                :target-path="queue.targetPath"
                :data-testid="'queue-' + queue.kind"
            />
        </div>
    </section>
</template>
