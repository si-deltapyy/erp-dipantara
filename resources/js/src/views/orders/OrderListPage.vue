<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { orderStatuses } from '@/core/types/order'
import { useOrderList } from './composables/useOrderList'
import OrderTable from './components/OrderTable.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppTextInput from '@/components/ui/AppTextInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppPagination from '@/components/ui/AppPagination.vue'
const { t } = useI18n()
const {
    response,
    query,
    search,
    status,
    purchaseOrderId,
    sort,
    loading,
    error,
    refresh,
    changePage,
    applyFilters,
    canCreate,
    canReview,
} = useOrderList()
</script>
<template>
    <section class="space-y-6">
        <header class="flex flex-wrap items-start justify-between gap-4">
            <div>
                <p class="text-sm font-semibold text-primary">{{ t('orders.section') }}</p>
                <h1 class="mt-1 text-2xl font-bold">{{ t('orders.title') }}</h1>
                <p class="mt-2 text-sm text-muted">{{ t('orders.subtitle') }}</p>
            </div>
            <RouterLink
                v-if="canCreate"
                :to="{ name: 'order-new', query: $route.query }"
                class="primary-button"
                >{{ t('orders.add') }}</RouterLink
            >
        </header>
        <RouterLink
            v-if="canReview"
            :to="{
                name: 'orders',
                query: { ...$route.query, status: 'submitted', page: undefined },
            }"
            class="secondary-button"
            >{{ t('orders.reviewQueue') }}</RouterLink
        >
        <div class="panel space-y-5">
            <form class="space-y-4" @submit.prevent="applyFilters">
                <div class="grid gap-4 lg:grid-cols-2">
                    <AppTextInput
                        id="po-search"
                        v-model="search"
                        :label="t('orders.search')"
                        :maxlength="200"
                    />
                    <AppSelect
                        id="po-status"
                        v-model="status"
                        :label="t('orders.status')"
                        :options="[
                            { value: '', label: t('orders.allStatuses') },
                            ...orderStatuses.map((value) => ({
                                value,
                                label: t('orders.statuses.' + value),
                            })),
                        ]"
                    />
                    <AppTextInput
                        id="order-filter-po"
                        v-model="purchaseOrderId"
                        :label="t('orders.parentFilter')"
                    />
                    <AppSelect
                        id="po-sort"
                        v-model="sort"
                        :label="t('orders.sort')"
                        :options="[
                            { value: '-createdAt', label: t('orders.newest') },
                            { value: 'createdAt', label: t('orders.oldest') },
                        ]"
                    />
                </div>
                <div class="flex flex-wrap gap-3">
                    <AppButton type="submit">{{ t('orders.apply') }}</AppButton
                    ><AppButton variant="secondary" :pending="loading" @click="refresh">{{
                        t('orders.refresh')
                    }}</AppButton>
                </div>
            </form>
            <p v-if="loading" role="status">{{ t('orders.loading') }}</p>
            <p v-else-if="error" role="alert" class="text-red-700">{{ t(error) }}</p>
            <template v-else-if="response">
                <p class="text-sm text-muted">
                    {{ t('orders.total', { count: response.meta.total }) }}
                </p>
                <p v-if="!response.data.length" role="status">{{ t('orders.empty') }}</p>
                <OrderTable v-else :orders="response.data" />
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
