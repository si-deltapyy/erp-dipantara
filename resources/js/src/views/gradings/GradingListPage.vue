<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { gradingStatuses } from '@/core/types/grading'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppTextInput from '@/components/ui/AppTextInput.vue'
import AppPagination from '@/components/ui/AppPagination.vue'
import AppPageHeader from '@/components/ui/AppPageHeader.vue'
import AppPanel from '@/components/ui/AppPanel.vue'
import AppState from '@/components/ui/AppState.vue'
import GradingTable from './components/GradingTable.vue'
import { useGradingList } from './composables/useGradingList'

const { t } = useI18n()
const {
    response,
    query,
    search,
    loading,
    error,
    refresh,
    applyFilters,
    changePage,
    status,
    assignmentId,
    canReview,
} = useGradingList()
</script>

<template>
    <section class="grading-list min-w-0 space-y-6">
        <AppPageHeader :title="t('gradings.title')" :description="t('gradings.listDescription')">
            <template #actions>
                <RouterLink
                    v-if="canReview"
                    :to="{
                        name: 'gradings',
                        query: { ...$route.query, status: 'submitted', page: undefined },
                    }"
                    class="secondary-button"
                    >{{ t('gradings.reviewQueue') }}</RouterLink
                >
            </template>
        </AppPageHeader>
        <AppPanel :title="t('gradings.filters')">
            <form class="grading-list-filters" @submit.prevent="applyFilters">
                <AppTextInput
                    id="grading-search"
                    v-model="search"
                    :label="t('gradings.search')"
                    :maxlength="200"
                />
                <AppSelect
                    id="grading-status"
                    v-model="status"
                    renderer="nice"
                    :label="t('gradings.status')"
                    :options="[
                        { value: '', label: t('gradings.allStatuses') },
                        ...gradingStatuses.map((status) => ({
                            value: status,
                            label: t('gradings.statuses.' + status),
                        })),
                    ]"
                />
                <AppTextInput
                    id="grading-assignment"
                    v-model="assignmentId"
                    :label="t('gradings.assignmentFilter')"
                    :maxlength="100"
                />
                <div class="flex flex-wrap gap-3">
                    <AppButton type="submit" :disabled="loading">{{
                        t('gradings.apply')
                    }}</AppButton>
                    <AppButton variant="secondary" :pending="loading" @click="refresh">{{
                        t('gradings.refresh')
                    }}</AppButton>
                </div>
            </form>
        </AppPanel>
        <AppPanel
            :title="t('gradings.results')"
            :description="
                response && !loading && !error
                    ? t('gradings.total', { count: response.meta.total })
                    : undefined
            "
        >
            <AppState v-if="loading" kind="loading" :message="t('gradings.loading')" />
            <AppState v-else-if="error" kind="error" :message="t(error)" @retry="refresh" />
            <template v-else-if="response">
                <AppState
                    v-if="!response.data.length"
                    kind="empty"
                    :message="t('gradings.empty')"
                />
                <GradingTable v-else :gradings="response.data" />
            </template>
            <template v-if="response && !loading && !error" #footer>
                <AppPagination
                    numbered
                    :page="query.page"
                    :page-size="response.meta.perPage"
                    :total="response.meta.total"
                    @update:page="changePage"
                />
            </template>
        </AppPanel>
    </section>
</template>

<style scoped>
.grading-list-filters {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    align-items: end;
    gap: 16px;
}
.grading-list-filters > * {
    min-width: 0;
}
@media (min-width: 768px) {
    .grading-list-filters {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}
@media (min-width: 1280px) {
    .grading-list-filters {
        grid-template-columns: minmax(0, 2fr) repeat(2, minmax(0, 1fr));
    }
}
</style>
