<script setup lang="ts">
import AppPageHeader from '@/components/ui/AppPageHeader.vue'
import AppPanel from '@/components/ui/AppPanel.vue'
import AppState from '@/components/ui/AppState.vue'

import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppSelect from '@/components/ui/AppSelect.vue'
import { useI18n } from 'vue-i18n'
import { useMasterList } from '@/composables/useMasterList'
import { usePaymentApi } from './composables/usePaymentApi'
import PaymentTable from './components/PaymentTable.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppTextInput from '@/components/ui/AppTextInput.vue'
import AppPagination from '@/components/ui/AppPagination.vue'
import { canCreatePayment } from '@/core/domain/payment-policy'
import { useSessionStore } from '@/stores/session'
const session = useSessionStore()
const canCreate = computed(() => canCreatePayment(session.user))
const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const hasFilters = computed(() =>
    ['search', 'purchaseOrderId', 'invoiceId', 'status', 'direction'].some(
        (key) => !!route.query[key],
    ),
)
async function clearFilters(): Promise<void> {
    await router.replace({ query: {} })
}
const direction = computed(() =>
    typeof route.query.direction === 'string' ? route.query.direction : '',
)
const status = computed(() => (typeof route.query.status === 'string' ? route.query.status : ''))
const directions = computed(() => [
    { value: '', label: t('payments.allDirections') },
    ...['receivable', 'payable'].map((value) => ({ value, label: t('payments.' + value) })),
])
const statuses = computed(() => [
    { value: '', label: t('payments.allStatuses') },
    ...['draft', 'submitted', 'approved', 'rejected'].map((value) => ({
        value,
        label: t('payments.statuses.' + value),
    })),
])
function filters(): Record<string, string | undefined> {
    return Object.fromEntries(
        ['purchaseOrderId', 'invoiceId', 'direction', 'status'].map((key) => [
            key,
            typeof route.query[key] === 'string' ? route.query[key] : undefined,
        ]),
    )
}
async function changeFilter(key: string, value: string): Promise<void> {
    await router.replace({ query: { ...route.query, page: undefined, [key]: value || undefined } })
}
const { response, query, search, loading, error, refresh, searchRecords, changePage } =
    useMasterList(usePaymentApi(), 'payments', filters)
</script>
<template>
    <section class="min-w-0 space-y-6">
        <AppPageHeader :title="t('payments.title')" :description="t('payments.subtitle')"
            ><template #actions
                ><RouterLink v-if="canCreate" :to="{ name: 'invoices' }" class="primary-button">{{
                    t('payments.add')
                }}</RouterLink></template
            ></AppPageHeader
        >
        <AppPanel :title="t('payments.filters')" class="space-y-4">
            <form
                class="grid items-end gap-4 md:grid-cols-2 xl:grid-cols-3"
                @submit.prevent="searchRecords"
            >
                <div class="min-w-0">
                    <AppTextInput
                        id="payment-search"
                        v-model="search"
                        :label="t('payments.search')"
                        :maxlength="200"
                    />
                </div>
                <AppSelect
                    id="payment-direction-filter"
                    renderer="nice"
                    :model-value="direction"
                    :options="directions"
                    :label="t('payments.direction')"
                    @update:model-value="changeFilter('direction', $event)"
                />
                <AppSelect
                    id="payment-status-filter"
                    renderer="nice"
                    :model-value="status"
                    :options="statuses"
                    :label="t('payments.status')"
                    @update:model-value="changeFilter('status', $event)"
                />
                <div class="flex flex-wrap gap-3 md:col-span-2 xl:col-span-3">
                    <AppButton type="submit">{{ t('payments.searchAction') }}</AppButton
                    ><AppButton variant="secondary" :pending="loading" @click="refresh">{{
                        t('payments.refresh')
                    }}</AppButton>
                </div>
            </form>
            <AppButton v-if="hasFilters" variant="secondary" @click="clearFilters">{{
                t('payments.clearFilters')
            }}</AppButton>
        </AppPanel>
        <AppPanel
            :title="t('payments.results')"
            :description="
                response && !loading && !error
                    ? t('payments.total', { count: response.meta.total })
                    : undefined
            "
            class="min-w-0"
        >
            <AppState v-if="loading" kind="loading" :message="t('payments.loading')" />
            <AppState v-else-if="error" kind="error" :message="t(error)" @retry="refresh" />
            <template v-else-if="response"
                ><AppState
                    v-if="!response.data.length"
                    kind="empty"
                    :message="t('payments.empty')" /><PaymentTable v-else :payments="response.data"
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
