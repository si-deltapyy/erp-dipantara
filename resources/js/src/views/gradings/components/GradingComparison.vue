<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { Grading } from '@/core/types/grading'
import { useGradingRevisionSource } from '../composables/useGradingRevisionSource'
import GradingMeasurements from './GradingMeasurements.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppPanel from '@/components/ui/AppPanel.vue'
const props = defineProps<{ grading: Grading }>()
const { t } = useI18n()
const { parent, loading, error, refresh } = useGradingRevisionSource(() => props.grading)
</script>
<template>
    <div class="space-y-4">
        <p v-if="loading" role="status">{{ t('gradings.loading') }}</p>
        <div v-else-if="error" role="alert">
            <p>{{ t(error) }}</p>
            <AppButton @click="refresh">{{ t('gradings.refresh') }}</AppButton>
        </div>
        <div class="grid gap-6 xl:grid-cols-2">
            <AppPanel v-if="parent" :title="t('gradings.previousResult')" class="min-w-0 space-y-4">
                <p class="text-sm text-muted">{{ t('gradings.statuses.' + parent.status) }}</p>
                <GradingMeasurements :grading="parent" />
                <RouterLink
                    :to="{ name: 'grading-detail', params: { id: parent.id } }"
                    class="secondary-button"
                    >{{ t('gradings.openPrevious') }}</RouterLink
                >
            </AppPanel>
            <AppPanel :title="t('gradings.revisedResult')" class="min-w-0 space-y-4">
                <GradingMeasurements :grading="grading" />
            </AppPanel>
        </div>
    </div>
</template>
