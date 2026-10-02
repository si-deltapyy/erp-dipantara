<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useGraderList } from './composables/useGraderList'
import GraderTable from './components/GraderTable.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppTextInput from '@/components/ui/AppTextInput.vue'
import AppPagination from '@/components/ui/AppPagination.vue'
import AppPageHeader from '@/components/ui/AppPageHeader.vue'
import AppPanel from '@/components/ui/AppPanel.vue'
const { t } = useI18n()
const { response, query, search, loading, error, refresh, searchGraders, changePage } =
    useGraderList()
</script>
<template>
    <section class="space-y-6">
        <AppPageHeader :title="t('graders.title')" :description="t('graders.subtitle')">
            <template #actions
                ><AppButton disabled :title="t('ui.writeUnavailable')">{{
                    t('graders.add')
                }}</AppButton></template
            >
        </AppPageHeader>
        <p role="status" class="text-sm text-muted">{{ t('ui.writeUnavailable') }}</p>
        <AppPanel :title="t('graders.list')" class="space-y-5">
            <template #actions
                ><span v-if="response" class="text-sm text-muted">{{
                    t('graders.total', { count: response.meta.total })
                }}</span></template
            >
            <form
                class="flex flex-wrap items-end gap-3 border-b border-line pb-5"
                @submit.prevent="searchGraders"
            >
                <div class="min-w-0 flex-1 basis-64">
                    <AppTextInput
                        id="grader-search"
                        v-model="search"
                        :label="t('graders.search')"
                        :placeholder="t('graders.searchHint')"
                        :maxlength="200"
                    />
                </div>
                <AppButton type="submit" variant="secondary">{{
                    t('graders.searchAction')
                }}</AppButton>
                <AppButton variant="secondary" :pending="loading" @click="refresh">{{
                    t('graders.refresh')
                }}</AppButton>
            </form>

            <p v-if="error" role="alert" class="text-sm text-danger">{{ t(error) }}</p>
            <GraderTable
                :graders="response?.data ?? []"
                :state="loading ? 'loading' : error ? 'error' : 'ready'"
                @retry="refresh"
            />
            <template #footer
                ><AppPagination
                    v-if="response && !error"
                    numbered
                    :page="query.page"
                    :page-size="response.meta.perPage"
                    :total="response.meta.total"
                    :disabled="loading"
                    @update:page="changePage"
            /></template>
        </AppPanel>
    </section>
</template>
