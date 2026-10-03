<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { DashboardTimelineEntry } from '@/core/types/dashboard-overview'
import AppPanel from '@/components/ui/AppPanel.vue'
import AppIcon from '@/components/ui/AppIcon.vue'

defineProps<{ entries: readonly DashboardTimelineEntry[] }>()
const { t } = useI18n()
const icons = { order: 'document', delivery: 'truck', payment: 'wallet' } as const
</script>

<template>
    <AppPanel
        :title="t('overview.activities')"
        :description="t('overview.activityDescription')"
        class="wf-timeline"
    >
        <ol v-if="entries.length" class="wf-timeline-list">
            <li v-for="entry in entries" :key="entry.id">
                <span class="wf-timeline-icon"
                    ><AppIcon :name="icons[entry.kind]" :size="16"
                /></span>
                <div>
                    <strong>{{ entry.title }}</strong>
                    <p>{{ entry.description }}</p>
                </div>
                <time>{{ entry.time }}</time>
            </li>
        </ol>
        <p v-else class="wf-empty">{{ t('overview.queueEmpty') }}</p>
    </AppPanel>
</template>
