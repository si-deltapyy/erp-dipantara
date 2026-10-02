<script setup lang="ts">
import AppPageHeader from '@/components/ui/AppPageHeader.vue'
import AppPanel from '@/components/ui/AppPanel.vue'
import AppState from '@/components/ui/AppState.vue'

import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useMasterList } from '@/composables/useMasterList'
import { useClosingApi } from './composables/useClosingApi'
import AppButton from '@/components/ui/AppButton.vue'
import AppTextInput from '@/components/ui/AppTextInput.vue'
import AppPagination from '@/components/ui/AppPagination.vue'
import ClosingTable from './components/ClosingTable.vue'
const { t } = useI18n()
const route = useRoute()
const { response, query, search, loading, error, refresh, searchRecords, changePage } =
    useMasterList(useClosingApi(), 'closings', () => ({
        purchaseOrderId:
            typeof route.query.purchaseOrderId === 'string'
                ? route.query.purchaseOrderId
                : undefined,
        status: typeof route.query.status === 'string' ? route.query.status : undefined,
    }))
</script>
<template>
    <section class="min-w-0 space-y-6">
        <AppPageHeader :title="t('closings.title')" :description="t('closings.listDescription')" />
        <AppPanel :title="t('closings.filters')">
            <form class="flex flex-wrap items-end gap-3" @submit.prevent="searchRecords">
                <div class="min-w-0 flex-1">
                    <AppTextInput
                        id="closing-search"
                        v-model="search"
                        :label="t('closings.search')"
                    />
                </div>
                <AppButton type="submit">{{ t('closings.searchAction') }}</AppButton>
                <AppButton variant="secondary" :pending="loading" @click="refresh">{{
                    t('closings.refresh')
                }}</AppButton>
            </form>
        </AppPanel>
        <AppPanel
            :title="t('closings.results')"
            :description="
                response && !loading && !error
                    ? t('closings.total', { count: response.meta.total })
                    : undefined
            "
            class="min-w-0"
        >
            <AppState v-if="loading" kind="loading" :message="t('closings.loading')" />
            <AppState v-else-if="error" kind="error" :message="t(error)" @retry="refresh" />
            <template v-else-if="response"
                ><AppState
                    v-if="!response.data.length"
                    kind="empty"
                    :message="t('closings.empty')" /><ClosingTable v-else :closings="response.data"
            /></template>
            <template v-if="response && !loading && !error" #footer
                ><AppPagination
                    numbered
                    :page="query.page"
                    :page-size="query.perPage"
                    :total="response.meta.total"
                    :disabled="loading"
                    @update:page="changePage"
            /></template>
        </AppPanel>
    </section>
</template>
