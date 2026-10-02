<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { DashboardWorkQueue, DashboardWorkStatus } from '@/core/types/dashboard-overview'
import AppPanel from '@/components/ui/AppPanel.vue'
import AppIcon from '@/components/ui/AppIcon.vue'

const props = defineProps<{ queues: readonly DashboardWorkQueue[]; selected: string }>()
defineEmits<{ select: [status: DashboardWorkStatus] }>()
const { t } = useI18n()
const total = computed(() => props.queues.reduce((sum, queue) => sum + queue.count, 0))
</script>

<template>
    <AppPanel
        :title="t('overview.queues')"
        :description="t('overview.queueDescription')"
        class="wf-distribution"
    >
        <div class="wf-distribution-body">
            <p class="wf-queue-total">{{ t('overview.queueTotal', { count: total }) }}</p>
            <div v-if="total" class="wf-distribution-bar" aria-hidden="true">
                <span
                    v-for="queue in queues"
                    :key="queue.status"
                    :class="`wf-queue-color--${queue.status}`"
                    :style="{ flexGrow: queue.count }"
                />
            </div>
            <p v-else class="wf-empty">{{ t('overview.queueEmpty') }}</p>
            <div class="wf-queue-legend">
                <button
                    v-for="queue in queues"
                    :key="queue.status"
                    type="button"
                    :aria-pressed="selected === queue.status"
                    @click="$emit('select', queue.status)"
                >
                    <span
                        class="wf-legend-dot"
                        :class="`wf-queue-color--${queue.status}`"
                    /><span>{{ t(`overview.${queue.status}`) }}</span
                    ><strong>{{ queue.count }}</strong
                    ><AppIcon name="chevron" :size="13" />
                </button>
            </div>
        </div>
    </AppPanel>
</template>
