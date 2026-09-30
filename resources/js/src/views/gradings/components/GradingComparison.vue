<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { Grading } from '@/core/types/grading'
import { useGradingRevisionSource } from '../composables/useGradingRevisionSource'
import GradingMeasurements from './GradingMeasurements.vue'
import AppButton from '@/components/ui/AppButton.vue'
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
            <section v-if="parent" :aria-label="t('gradings.previousResult')" class="space-y-4">
                <h3 class="font-bold">
                    {{ t('gradings.previousResult') }} /
                    {{ t('gradings.statuses.' + parent.status) }}
                </h3>
                <GradingMeasurements :grading="parent" />
                <RouterLink
                    :to="{ name: 'grading-detail', params: { id: parent.id } }"
                    class="secondary-button"
                    >{{ t('gradings.openPrevious') }}</RouterLink
                >
            </section>
            <section :aria-label="t('gradings.revisedResult')" class="space-y-4">
                <h3 class="font-bold">{{ t('gradings.revisedResult') }}</h3>
                <GradingMeasurements :grading="grading" />
            </section>
        </div>
    </div>
</template>
