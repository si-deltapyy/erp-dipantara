<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { Grading } from '@/core/types/grading'
import { useGradingApi } from '../composables/useGradingApi'
import { useMasterList } from '@/composables/useMasterList'
import AppButton from '@/components/ui/AppButton.vue'
import AppPagination from '@/components/ui/AppPagination.vue'
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
    <section :aria-label="t('gradings.assignmentHistory')" class="panel space-y-4">
        <h2 class="text-lg font-bold">{{ t('gradings.assignmentHistory') }}</h2>
        <p v-if="loading" role="status">{{ t('gradings.loading') }}</p>
        <div v-else-if="error" role="alert">
            <p>{{ t(error) }}</p>
            <AppButton @click="refresh">{{ t('gradings.refresh') }}</AppButton>
        </div>
        <template v-else-if="response">
            <article
                v-for="record in response.data"
                :key="record.id"
                class="space-y-2 rounded-md border border-slate-200 p-4"
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
                :page="query.page"
                :page-size="response.meta.perPage"
                :total="response.meta.total"
                @update:page="changePage"
            />
        </template>
    </section>
</template>
