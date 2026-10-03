<script setup lang="ts">
import { useRoute } from 'vue-router'
import GradingRevisionEditor from './components/GradingRevisionEditor.vue'
import { useI18n } from 'vue-i18n'
import { useGradingFormContext } from './composables/useGradingFormContext'
import GradingEditor from './components/GradingEditor.vue'
import AppPageHeader from '@/components/ui/AppPageHeader.vue'
import AppState from '@/components/ui/AppState.vue'
const { t } = useI18n()
const route = useRoute()
const { grading, assignment, loading, error, permitted, refresh } = useGradingFormContext()
</script>
<template>
    <section class="min-w-0 space-y-6">
        <AppPageHeader
            :description="
                t(route.name === 'grading-revise' ? 'gradings.revisionHint' : 'gradings.subtitle')
            "
            :title="
                t(
                    route.name === 'grading-revise'
                        ? 'gradings.revise'
                        : route.name === 'grading-edit'
                          ? 'gradings.edit'
                          : 'gradings.add',
                )
            "
        />
        <AppState v-if="loading" kind="loading" :message="t('gradings.loading')" />
        <AppState v-else-if="error" kind="error" :message="t(error)" @retry="refresh" />
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
        <p v-else role="alert" class="break-words">{{ t('gradings.locked') }}</p>
    </section>
</template>
