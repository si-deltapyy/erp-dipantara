<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { Grading } from '@/core/types/grading'
import { useGradingApi } from '../composables/useGradingApi'
import { useMasterList } from '@/composables/useMasterList'
import AppButton from '@/components/ui/AppButton.vue'
import AppPagination from '@/components/ui/AppPagination.vue'
import AppPanel from '@/components/ui/AppPanel.vue'
import AppState from '@/components/ui/AppState.vue'
const props = defineProps<{ grading: Grading }>()
const { t } = useI18n()
const api = useGradingApi()
const { response, query, loading, error, refresh, changePage } = useMasterList(
    {
        list: (query, signal) =>
            api.list({ ...query, search: '', assignmentId: props.grading.assignmentId }, signal),
        subscribe: api.subscribe,
    },
    'gradings',
)
</script>
<template>
    <AppPanel :title="t('gradings.assignmentHistory')" class="min-w-0 space-y-4">
        <p v-if="loading" role="status">{{ t('gradings.loading') }}</p>
        <div v-else-if="error" role="alert">
            <p>{{ t(error) }}</p>
            <AppButton @click="refresh">{{ t('gradings.refresh') }}</AppButton>
        </div>
        <template v-else-if="response">
            <AppState v-if="!response.data.length" kind="empty" :message="t('gradings.empty')" />
            <article
                v-for="record in response.data"
                :key="record.id"
                class="space-y-3 break-words border-t border-line py-4"
            >
                <p>
                    {{ record.gradingDate }} / {{ t('gradings.statuses.' + record.status) }} /
                    {{ record.totalVolumeM3 }} m³
                </p>
                <p v-if="record.revisionReason">{{ record.revisionReason }}</p>
                <RouterLink
                    v-if="record.id !== grading.id"
                    :to="{ name: 'grading-detail', params: { id: record.id } }"
                    class="secondary-button"
                    >{{ t('gradings.open') }}</RouterLink
                >
            </article>
            <AppPagination
                numbered
                :page="query.page"
                :page-size="response.meta.perPage"
                :total="response.meta.total"
                @update:page="changePage"
            />
        </template>
    </AppPanel>
</template>
