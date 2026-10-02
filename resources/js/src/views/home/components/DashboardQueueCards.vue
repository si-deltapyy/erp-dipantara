<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { DashboardQueueSummary } from '@/core/types/dashboard-queue'
import AppPanel from '@/components/ui/AppPanel.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
defineProps<{ queues: readonly DashboardQueueSummary[] }>()
const { t } = useI18n()
</script>
<template>
    <AppPanel :title="t('dashboard.queueTitle')" :description="t('dashboard.queueDescription')">
        <p v-if="!queues.length" class="wf-empty" role="status">{{ t('dashboard.queueEmpty') }}</p>
        <ul v-else class="divide-y divide-line">
            <li v-for="queue in queues" :key="queue.kind">
                <RouterLink
                    :to="queue.targetPath"
                    class="wf-queue-link"
                    :data-testid="'queue-' + queue.kind"
                >
                    <span class="flex min-w-0 items-center gap-3"
                        ><AppIcon name="document" /><span>{{
                            t('dashboard.queues.' + queue.kind)
                        }}</span></span
                    >
                    <strong class="wf-queue-count">{{
                        queue.count.toLocaleString('id-ID')
                    }}</strong>
                </RouterLink>
            </li>
        </ul>
    </AppPanel>
</template>
