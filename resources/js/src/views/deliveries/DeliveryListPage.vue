<script setup lang="ts">
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
    <section class="space-y-6">
        <header class="flex flex-wrap items-start justify-between gap-4">
            <div>
                <p class="text-sm font-semibold text-primary">{{ t('deliveries.section') }}</p>
                <h1 class="mt-1 text-2xl font-bold">{{ t('deliveries.title') }}</h1>
                <p class="mt-2 text-sm text-muted">{{ t('deliveries.subtitle') }}</p>
            </div>
            <RouterLink v-if="canCreate" :to="{ name: 'delivery-new' }" class="primary-button">{{
                t('deliveries.add')
            }}</RouterLink>
        </header>
        <div class="panel space-y-5">
            <form class="flex flex-wrap items-end gap-3" @submit.prevent="searchRecords">
                <div class="min-w-48 flex-1">
                    <AppTextInput
                        id="delivery-search"
                        v-model="search"
                        :label="t('deliveries.search')"
                        :maxlength="200"
                    />
                </div>
                <AppSelect
                    id="delivery-status"
                    :model-value="status"
                    :options="statusOptions"
                    :label="t('deliveries.status')"
                    @update:model-value="changeStatus"
                />
                <AppButton type="submit">{{ t('deliveries.searchAction') }}</AppButton
                ><AppButton variant="secondary" :pending="loading" @click="refresh">{{
                    t('deliveries.refresh')
                }}</AppButton>
            </form>
            <p v-if="loading" role="status">{{ t('deliveries.loading') }}</p>
            <p v-else-if="error" role="alert">{{ t(error) }}</p>
            <template v-else-if="response"
                ><p class="text-sm text-muted">
                    {{ t('deliveries.total', { count: response.meta.total }) }}
                </p>
                <p v-if="!response.data.length" role="status">{{ t('deliveries.empty') }}</p>
                <DeliveryTable v-else :deliveries="response.data" /><AppPagination
                    :page="query.page"
                    :page-size="response.meta.perPage"
                    :total="response.meta.total"
                    @update:page="changePage"
            /></template>
        </div>
    </section>
</template>
