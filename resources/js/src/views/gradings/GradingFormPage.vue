<script setup lang="ts">
import { useRoute } from 'vue-router'
import GradingRevisionEditor from './components/GradingRevisionEditor.vue'
import { useI18n } from 'vue-i18n'
import { useGradingFormContext } from './composables/useGradingFormContext'
import GradingEditor from './components/GradingEditor.vue'
import AppButton from '@/components/ui/AppButton.vue'
const { t } = useI18n()
const route = useRoute()
const { grading, assignment, loading, error, permitted, refresh } = useGradingFormContext()
</script>
<template>
    <section class="mx-auto max-w-4xl space-y-6">
        <h1 class="text-2xl font-bold">
            {{
                t(
                    route.name === 'grading-revise'
                        ? 'gradings.revise'
                        : grading
                          ? 'gradings.edit'
                          : 'gradings.add',
                )
            }}
        </h1>
        <p v-if="loading" role="status">{{ t('gradings.loading') }}</p>
        <div v-else-if="error" role="alert" class="panel space-y-3">
            <p>{{ t(error) }}</p>
            <AppButton @click="refresh">{{ t('gradings.refresh') }}</AppButton>
        </div>
        <GradingRevisionEditor
            v-else-if="assignment && grading && permitted && route.name === 'grading-revise'"
            :key="grading.id"
            :grading="grading"
            :assignment="assignment"
        />
        <GradingEditor
            v-else-if="assignment && permitted"
            :key="grading?.id ?? assignment.id"
            :grading="grading"
            :assignment="assignment"
        />
        <p v-else role="alert">{{ t('gradings.locked') }}</p>
    </section>
</template>
