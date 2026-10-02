<script setup lang="ts">
import { useSessionStore } from '@/stores/session'
import { hasBusinessPermission } from '@/core/domain/record-policy'
import { useI18n } from 'vue-i18n'
import { purchaseOrderStatuses } from '@/core/types/purchase-order'
import { usePurchaseOrderList } from './composables/usePurchaseOrderList'
import PurchaseOrderTable from './components/PurchaseOrderTable.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppTextInput from '@/components/ui/AppTextInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppPagination from '@/components/ui/AppPagination.vue'
import AppPageHeader from '@/components/ui/AppPageHeader.vue'
import AppPanel from '@/components/ui/AppPanel.vue'
import PurchaseOrderLookup from './components/PurchaseOrderLookup.vue'
const { t } = useI18n()
const session = useSessionStore()
const {
    response,
    query,
    search,
    status,
    buyerId,
    mitraId,
    graderId,
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
        <AppPageHeader
            :title="
                t(
                    $route.name === 'buyer-history'
                        ? 'purchase-orders.history'
                        : 'purchase-orders.title',
                )
            "
            :description="t('purchase-orders.subtitle')"
            ><template #actions>
                <RouterLink
                    v-if="canCreate"
                    :to="{ name: 'purchase-order-new', query: $route.query }"
                    class="primary-button"
                    >{{ t('purchase-orders.add') }}</RouterLink
                >
            </template></AppPageHeader
        >
        <RouterLink
            v-if="canReview"
            :to="{
                name: 'purchase-orders',
                query: { ...$route.query, status: 'submitted', page: undefined },
            }"
            class="secondary-button"
            >{{ t('purchase-orders.reviewQueue') }}</RouterLink
        >
        <AppPanel :title="t('purchase-orders.title')" class="space-y-5">
            <form class="space-y-4 border-b border-line pb-5" @submit.prevent="applyFilters">
                <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <AppTextInput
                        id="po-search"
                        v-model="search"
                        :label="t('purchase-orders.search')"
                        :maxlength="200"
                    />
                    <AppSelect
                        id="po-status"
                        v-model="status"
                        renderer="nice"
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
                    <PurchaseOrderLookup
                        v-if="hasBusinessPermission(session.user, 'mitras.lookup')"
                        id="po-filter-mitra"
                        v-model="mitraId"
                        kind="mitra"
                        :label="t('mitras.title')"
                    />
                    <PurchaseOrderLookup
                        v-if="hasBusinessPermission(session.user, 'graders.lookup')"
                        id="po-filter-grader"
                        v-model="graderId"
                        kind="grader"
                        :label="t('graders.title')"
                    />
                    <AppSelect
                        id="po-sort"
                        v-model="sort"
                        renderer="nice"
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
            <p v-else-if="error" role="alert" class="text-danger">{{ t(error) }}</p>
            <template v-else-if="response">
                <p class="text-sm text-muted">
                    {{ t('purchase-orders.total', { count: response.meta.total }) }}
                </p>
                <p v-if="!response.data.length" role="status">{{ t('purchase-orders.empty') }}</p>
                <PurchaseOrderTable v-else :orders="response.data" />
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
