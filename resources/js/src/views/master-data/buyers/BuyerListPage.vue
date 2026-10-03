<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useBuyerList } from './composables/useBuyerList'
import BuyerTable from './components/BuyerTable.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppTextInput from '@/components/ui/AppTextInput.vue'
import AppPagination from '@/components/ui/AppPagination.vue'
import AppPageHeader from '@/components/ui/AppPageHeader.vue'
import AppPanel from '@/components/ui/AppPanel.vue'
const { t } = useI18n()
const { response, query, search, loading, error, refresh, searchBuyers, changePage } =
    useBuyerList()
</script>
<template>
    <section class="space-y-6">
        <AppPageHeader :title="t('buyers.title')" :description="t('buyers.subtitle')">
            <template #actions
                ><AppButton disabled :title="t('ui.writeUnavailable')">{{
                    t('buyers.add')
                }}</AppButton></template
            >
        </AppPageHeader>
        <p role="status" class="text-sm text-muted">{{ t('ui.writeUnavailable') }}</p>
        <AppPanel :title="t('buyers.list')" class="space-y-5">
            <template #actions
                ><span v-if="response" class="text-sm text-muted">{{
                    t('buyers.total', { count: response.meta.total })
                }}</span></template
            >
            <form
                class="flex flex-wrap items-end gap-3 border-b border-line pb-5"
                @submit.prevent="searchBuyers"
            >
                <div class="min-w-0 flex-1 basis-64">
                    <AppTextInput
                        id="buyer-search"
                        v-model="search"
                        :label="t('buyers.search')"
                        :placeholder="t('buyers.searchHint')"
                        :maxlength="200"
                    />
                </div>
                <AppButton type="submit" variant="secondary">{{
                    t('buyers.searchAction')
                }}</AppButton>
                <AppButton variant="secondary" :pending="loading" @click="refresh">{{
                    t('buyers.refresh')
                }}</AppButton>
            </form>

            <p v-if="error" role="alert" class="text-sm text-danger">{{ t(error) }}</p>
            <BuyerTable
                :buyers="response?.data ?? []"
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
