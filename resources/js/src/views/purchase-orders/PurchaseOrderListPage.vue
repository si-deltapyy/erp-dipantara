<script setup lang="ts">
import { integrationPermissions } from '@/core/constants/business-permissions'
import { canAccess } from '@/core/domain/access-policy'
import { computed } from 'vue'
import { useSessionStore } from '@/stores/session'
import { useI18n } from 'vue-i18n'
import { usePurchaseOrderApi } from './composables/usePurchaseOrderApi'
import { useMasterList } from '@/composables/useMasterList'
import AppButton from '@/components/ui/AppButton.vue'
import AppPagination from '@/components/ui/AppPagination.vue'
import AppPageHeader from '@/components/ui/AppPageHeader.vue'
import AppPanel from '@/components/ui/AppPanel.vue'
import PurchaseOrderTable from './components/PurchaseOrderTable.vue'
import AppTextInput from '@/components/ui/AppTextInput.vue'
import AppState from '@/components/ui/AppState.vue'
const { t } = useI18n()
const session = useSessionStore()
const canCreate = computed(() =>
    canAccess(session.user, integrationPermissions['purchase-orders.create']),
)
const { response, search, searchRecords, loading, error, refresh, changePage } = useMasterList(
    usePurchaseOrderApi(),
    'purchase-orders',
    undefined,
    undefined,
    integrationPermissions['purchase-orders.read'],
)
</script>
<template>
    <section class="space-y-6">
        <AppPageHeader
            :title="t('purchase-orders.title')"
            :description="t('purchase-orders.subtitle')"
        >
            <template #actions
                ><RouterLink
                    v-if="canCreate"
                    :to="{ name: 'purchase-order-new' }"
                    class="primary-button"
                    >{{ t('purchase-orders.add') }}</RouterLink
                ></template
            >
        </AppPageHeader>
        <AppPanel :title="t('purchase-orders.title')">
            <template #actions
                ><AppButton variant="secondary" :pending="loading" @click="refresh">{{
                    t('purchase-orders.refresh')
                }}</AppButton></template
            >
            <form class="mb-5 flex items-end gap-3" @submit.prevent="searchRecords">
                <AppTextInput
                    id="purchase-order-search"
                    v-model="search"
                    :label="t('purchase-orders.search')"
                    :maxlength="200"
                    class="flex-1"
                />
                <AppButton type="submit" variant="secondary">{{
                    t('purchase-orders.searchAction')
                }}</AppButton>
            </form>
            <AppState v-if="loading" kind="loading" />
            <AppState v-else-if="error" kind="error" :message="t(error)" @retry="refresh" />
            <PurchaseOrderTable v-else-if="response" :orders="response.data" />
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
