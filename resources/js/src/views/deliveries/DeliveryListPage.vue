<script setup lang="ts">
import AppPageHeader from '@/components/ui/AppPageHeader.vue'
import AppPanel from '@/components/ui/AppPanel.vue'
import AppState from '@/components/ui/AppState.vue'

import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { deliveryStatuses } from '@/core/types/delivery'
import AppSelect from '@/components/ui/AppSelect.vue'
import { useI18n } from 'vue-i18n'
import { useMasterList } from '@/composables/useMasterList'
import { useDeliveryApi } from './composables/useDeliveryApi'
import DeliveryTable from './components/DeliveryTable.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppTextInput from '@/components/ui/AppTextInput.vue'
import AppPagination from '@/components/ui/AppPagination.vue'
const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const status = computed(() => (typeof route.query.status === 'string' ? route.query.status : ''))
const statusOptions = computed(() => [
    { value: '', label: t('deliveries.allStatuses') },
    ...deliveryStatuses.map((value) => ({ value, label: t('deliveries.statuses.' + value) })),
])
function queryFilters(): Record<string, string | undefined> {
    return Object.fromEntries(
        ['status', 'purchaseOrderId', 'assignmentId'].map((key) => [
            key,
            typeof route.query[key] === 'string' ? route.query[key] : undefined,
        ]),
    )
}
async function changeStatus(value: string): Promise<void> {
    await router.replace({ query: { ...route.query, page: undefined, status: value || undefined } })
}
const { response, query, search, loading, error, canCreate, refresh, searchRecords, changePage } =
    useMasterList(useDeliveryApi(), 'deliveries', queryFilters)
</script>
<template>
    <section class="min-w-0 space-y-6">
        <AppPageHeader :title="t('deliveries.title')" :description="t('deliveries.subtitle')">
            <template #actions
                ><RouterLink
                    v-if="canCreate"
                    :to="{ name: 'delivery-new' }"
                    class="primary-button"
                    >{{ t('deliveries.add') }}</RouterLink
                ></template
            >
        </AppPageHeader>
        <AppPanel :title="t('deliveries.filters')">
            <form
                class="grid items-end gap-4 md:grid-cols-2 xl:grid-cols-3"
                @submit.prevent="searchRecords"
            >
                <AppTextInput
                    id="delivery-search"
                    v-model="search"
                    :label="t('deliveries.search')"
                    :maxlength="200"
                />
                <AppSelect
                    id="delivery-status"
                    renderer="nice"
                    :model-value="status"
                    :options="statusOptions"
                    :label="t('deliveries.status')"
                    @update:model-value="changeStatus"
                />
                <div class="flex flex-wrap gap-3">
                    <AppButton type="submit">{{ t('deliveries.searchAction') }}</AppButton
                    ><AppButton variant="secondary" :pending="loading" @click="refresh">{{
                        t('deliveries.refresh')
                    }}</AppButton>
                </div>
            </form>
        </AppPanel>
        <AppPanel
            :title="t('deliveries.results')"
            :description="
                response && !loading && !error
                    ? t('deliveries.total', { count: response.meta.total })
                    : undefined
            "
            class="min-w-0"
        >
            <AppState v-if="loading" kind="loading" :message="t('deliveries.loading')" />
            <AppState v-else-if="error" kind="error" :message="t(error)" @retry="refresh" />
            <template v-else-if="response"
                ><AppState
                    v-if="!response.data.length"
                    kind="empty"
                    :message="t('deliveries.empty')" /><DeliveryTable
                    v-else
                    :deliveries="response.data"
            /></template>
            <template v-if="response && !loading && !error" #footer
                ><AppPagination
                    numbered
                    :page="query.page"
                    :page-size="response.meta.perPage"
                    :total="response.meta.total"
                    @update:page="changePage"
            /></template>
        </AppPanel>
    </section>
</template>
