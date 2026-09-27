<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { purchaseOrderStatuses } from '@/core/types/purchase-order'
import { usePurchaseOrderList } from './composables/usePurchaseOrderList'
import PurchaseOrderTable from './components/PurchaseOrderTable.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppTextInput from '@/components/ui/AppTextInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppPagination from '@/components/ui/AppPagination.vue'
import PurchaseOrderLookup from './components/PurchaseOrderLookup.vue'
const { t } = useI18n()
const {
    response,
    query,
    search,
    status,
    buyerId,
    sort,
    loading,
    error,
    refresh,
    changePage,
    applyFilters,
    canCreate,
    canReview,
} = usePurchaseOrderList()
</script>
<template>
    <section class="space-y-6">
        <header class="flex flex-wrap items-start justify-between gap-4">
            <div>
                <p class="text-sm font-semibold text-primary">{{ t('purchase-orders.section') }}</p>
                <h1 class="mt-1 text-2xl font-bold">{{ t('purchase-orders.title') }}</h1>
                <p class="mt-2 text-sm text-muted">{{ t('purchase-orders.subtitle') }}</p>
            </div>
            <RouterLink
                v-if="canCreate"
                :to="{ name: 'purchase-order-new', query: $route.query }"
                class="primary-button"
                >{{ t('purchase-orders.add') }}</RouterLink
            >
        </header>
        <RouterLink
            v-if="canReview"
            :to="{
                name: 'purchase-orders',
                query: { ...$route.query, status: 'submitted', page: undefined },
            }"
            class="secondary-button"
            >{{ t('purchase-orders.reviewQueue') }}</RouterLink
        >
        <div class="panel space-y-5">
            <form class="space-y-4" @submit.prevent="applyFilters">
                <div class="grid gap-4 lg:grid-cols-2">
                    <AppTextInput
                        id="po-search"
                        v-model="search"
                        :label="t('purchase-orders.search')"
                        :maxlength="200"
                    />
                    <AppSelect
                        id="po-status"
                        v-model="status"
                        :label="t('purchase-orders.status')"
                        :options="[
                            { value: '', label: t('purchase-orders.allStatuses') },
                            ...purchaseOrderStatuses.map((value) => ({
                                value,
                                label: t('purchase-orders.statuses.' + value),
                            })),
                        ]"
                    />
                    <PurchaseOrderLookup
                        id="po-filter-buyer"
                        v-model="buyerId"
                        kind="buyer"
                        :label="t('purchase-orders.buyerFilter')"
                    />
                    <AppSelect
                        id="po-sort"
                        v-model="sort"
                        :label="t('purchase-orders.sort')"
                        :options="[
                            { value: '-createdAt', label: t('purchase-orders.newest') },
                            { value: 'createdAt', label: t('purchase-orders.oldest') },
                        ]"
                    />
                </div>
                <div class="flex flex-wrap gap-3">
                    <AppButton type="submit">{{ t('purchase-orders.apply') }}</AppButton
                    ><AppButton variant="secondary" :pending="loading" @click="refresh">{{
                        t('purchase-orders.refresh')
                    }}</AppButton>
                </div>
            </form>
            <p v-if="loading" role="status">{{ t('purchase-orders.loading') }}</p>
            <p v-else-if="error" role="alert" class="text-red-700">{{ t(error) }}</p>
            <template v-else-if="response">
                <p class="text-sm text-muted">
                    {{ t('purchase-orders.total', { count: response.meta.total }) }}
                </p>
                <p v-if="!response.data.length" role="status">{{ t('purchase-orders.empty') }}</p>
                <PurchaseOrderTable v-else :orders="response.data" />
                <AppPagination
                    :page="query.page"
                    :page-size="response.meta.perPage"
                    :total="response.meta.total"
                    @update:page="changePage"
                />
            </template>
        </div>
    </section>
</template>
