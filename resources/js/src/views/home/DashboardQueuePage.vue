<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { processingQueueKinds } from '@/core/types/dashboard-queue'
import { useDashboardQueue } from './composables/useDashboardQueue'
import DashboardTransactionList from './components/DashboardTransactionList.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppTextInput from '@/components/ui/AppTextInput.vue'
import AppPagination from '@/components/ui/AppPagination.vue'
import AppPageHeader from '@/components/ui/AppPageHeader.vue'
const route = useRoute()
const { t } = useI18n()
const title = computed(() => {
    const kind = processingQueueKinds.find((candidate) => candidate === route.query.kind)
    return kind ? t('dashboard.queues.' + kind) : t('dashboard.queueTitle')
})
const { response, query, search, loading, error, refresh, searchRecords, changePage } =
    useDashboardQueue()
</script>
<template>
    <section class="space-y-6">
        <AppPageHeader :title="title" :description="t('dashboard.queueDescription')">
            <template #actions>
                <RouterLink :to="{ name: 'home' }" class="text-sm text-primary underline">{{
                    t('dashboard.back')
                }}</RouterLink>
            </template>
        </AppPageHeader>
        <div class="panel space-y-4">
            <form class="flex flex-wrap items-end gap-3" @submit.prevent="searchRecords">
                <div class="min-w-48 flex-1">
                    <AppTextInput
                        id="queue-search"
                        v-model="search"
                        :label="t('dashboard.search')"
                        :maxlength="200"
                    />
                </div>
                <AppButton type="submit">{{ t('dashboard.searchAction') }}</AppButton>
                <AppButton variant="secondary" :pending="loading" @click="refresh">{{
                    t('dashboard.refresh')
                }}</AppButton>
            </form>
            <p v-if="loading" role="status">{{ t('dashboard.loading') }}</p>
            <p v-else-if="error" role="alert">{{ t(error) }}</p>
            <template v-else-if="response">
                <p class="text-sm text-muted">
                    {{ t('dashboard.total', { count: response.meta.total }) }}
                </p>
                <p v-if="!response.data.length" role="status">{{ t('dashboard.queueEmpty') }}</p>
                <DashboardTransactionList :records="response.data" />
                <AppPagination
                    numbered
                    :disabled="loading"
                    :page="query.page"
                    :page-size="response.meta.perPage"
                    :total="response.meta.total"
                    @update:page="changePage"
                />
            </template>
        </div>
    </section>
</template>
