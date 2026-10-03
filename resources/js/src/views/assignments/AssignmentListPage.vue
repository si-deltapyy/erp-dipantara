<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useMasterList } from '@/composables/useMasterList'
import { useAssignmentApi } from '@/views/orders/composables/useAssignmentApi'
import AppButton from '@/components/ui/AppButton.vue'
import AppTextInput from '@/components/ui/AppTextInput.vue'
import AppPagination from '@/components/ui/AppPagination.vue'
import AppPageHeader from '@/components/ui/AppPageHeader.vue'
import AppPanel from '@/components/ui/AppPanel.vue'
import AssignmentTable from './components/AssignmentTable.vue'
const { t } = useI18n()
const { response, query, search, loading, error, refresh, searchRecords, changePage } =
    useMasterList(useAssignmentApi(), 'assignments')
</script>
<template>
    <section class="space-y-6">
        <AppPageHeader
            :title="t('assignments.assignedTitle')"
            :description="t('assignments.assignedHint')"
        />
        <AppPanel :title="t('assignments.title')">
            <form
                class="mb-5 flex flex-wrap items-end gap-4 border-b border-line pb-5"
                @submit.prevent="searchRecords"
            >
                <AppTextInput
                    id="assignment-search"
                    v-model="search"
                    class="min-w-0 flex-1 basis-64"
                    :label="t('orders.search')"
                    :maxlength="200"
                />
                <AppButton type="submit">{{ t('orders.apply') }}</AppButton>
                <AppButton variant="secondary" :pending="loading" @click="refresh">{{
                    t('orders.refresh')
                }}</AppButton>
            </form>
            <p v-if="error" role="alert" class="mb-4 text-danger">{{ t(error) }}</p>
            <AssignmentTable
                :assignments="response?.data ?? []"
                :state="loading ? 'loading' : error ? 'error' : 'ready'"
                @retry="refresh"
            />
            <template v-if="response && !error" #footer>
                <span class="text-sm text-muted">{{
                    t('orders.total', { count: response.meta.total })
                }}</span>
                <AppPagination
                    numbered
                    :disabled="loading"
                    :page="query.page"
                    :page-size="response.meta.perPage"
                    :total="response.meta.total"
                    @update:page="changePage"
                />
            </template>
        </AppPanel>
    </section>
</template>
