<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useDeliveryApi } from './composables/useDeliveryApi'
import { useMasterList } from '@/composables/useMasterList'
import DeliveryTable from './components/DeliveryTable.vue'
import AppPagination from '@/components/ui/AppPagination.vue'
import AppTextInput from '@/components/ui/AppTextInput.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppPageHeader from '@/components/ui/AppPageHeader.vue'
import AppPanel from '@/components/ui/AppPanel.vue'
import AppState from '@/components/ui/AppState.vue'
const { t } = useI18n()
const api = useDeliveryApi()
const { response, search, searchRecords, loading, error, refresh, changePage } = useMasterList(
    api,
    'deliveries',
    undefined,
    {
        searchText: (delivery) =>
            [
                delivery.purchaseOrderNumber,
                delivery.mitraName,
                delivery.licensePlate,
                delivery.buyerSakrNumber,
                delivery.companySakrNumber,
            ].join(' '),
        compare: (left, right) =>
            left.deliveryDate.localeCompare(right.deliveryDate) || left.id.localeCompare(right.id),
    },
)
</script>
<template>
    <section class="space-y-6">
        <AppPageHeader :title="t('deliveries.title')">
            <template #actions
                ><AppButton disabled :title="t('ui.featureUnavailable')">{{
                    t('deliveries.add')
                }}</AppButton></template
            >
        </AppPageHeader>
        <p role="status" class="text-sm text-muted">{{ t('ui.transactionUnavailable') }}</p>
        <AppPanel :title="t('deliveries.title')">
            <template #actions
                ><AppButton variant="secondary" :pending="loading" @click="refresh">{{
                    t('deliveries.refresh')
                }}</AppButton></template
            >
            <form class="mb-5 flex items-end gap-3" @submit.prevent="searchRecords">
                <AppTextInput
                    id="delivery-search"
                    v-model="search"
                    :label="t('deliveries.search')"
                    :maxlength="200"
                    class="flex-1"
                />
                <AppButton type="submit" variant="secondary">{{
                    t('deliveries.searchAction')
                }}</AppButton>
            </form>
            <AppState v-if="loading" kind="loading" />
            <AppState v-else-if="error" kind="error" :message="t(error)" @retry="refresh" />
            <DeliveryTable v-else-if="response" :deliveries="response.data" />
            <template #footer>
                <AppPagination
                    v-if="response && !error"
                    numbered
                    :disabled="loading"
                    :page="response.meta.page"
                    :page-size="response.meta.perPage"
                    :total="response.meta.total"
                    @update:page="changePage"
                />
            </template>
        </AppPanel>
    </section>
</template>
