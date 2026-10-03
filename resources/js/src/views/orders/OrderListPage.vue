<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useOrderApi } from './composables/useOrderApi'
import { useMasterList } from '@/composables/useMasterList'
import AppButton from '@/components/ui/AppButton.vue'
import AppPagination from '@/components/ui/AppPagination.vue'
import AppPageHeader from '@/components/ui/AppPageHeader.vue'
import AppPanel from '@/components/ui/AppPanel.vue'
import OrderTable from './components/OrderTable.vue'
import AppTextInput from '@/components/ui/AppTextInput.vue'
import AppState from '@/components/ui/AppState.vue'
const { t } = useI18n()
const { response, search, searchRecords, loading, error, refresh, changePage } = useMasterList(
    useOrderApi(),
    'orders',
)
</script>
<template>
    <section class="space-y-6">
        <AppPageHeader :title="t('orders.title')" :description="t('orders.subtitle')">
            <template #actions
                ><AppButton disabled :title="t('ui.featureUnavailable')">{{
                    t('orders.add')
                }}</AppButton></template
            >
        </AppPageHeader>
        <p role="status" class="text-sm text-muted">{{ t('ui.transactionUnavailable') }}</p>
        <AppPanel :title="t('orders.title')">
            <template #actions
                ><AppButton variant="secondary" :pending="loading" @click="refresh">{{
                    t('orders.refresh')
                }}</AppButton></template
            >
            <form class="mb-5 flex items-end gap-3" @submit.prevent="searchRecords">
                <AppTextInput
                    id="order-search"
                    v-model="search"
                    :label="t('orders.search')"
                    :maxlength="200"
                    class="flex-1"
                />
                <AppButton type="submit" variant="secondary">{{
                    t('orders.searchAction')
                }}</AppButton>
            </form>
            <AppState v-if="loading" kind="loading" />
            <AppState v-else-if="error" kind="error" :message="t(error)" @retry="refresh" />
            <OrderTable v-else-if="response" :orders="response.data" />
            <template #footer
                ><AppPagination
                    v-if="response && !error"
                    numbered
                    :disabled="loading"
                    :page="response.meta.page"
                    :page-size="response.meta.perPage"
                    :total="response.meta.total"
                    @update:page="changePage"
            /></template>
        </AppPanel>
    </section>
</template>
