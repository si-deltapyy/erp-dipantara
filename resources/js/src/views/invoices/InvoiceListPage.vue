<script setup lang="ts">
import AppPageHeader from '@/components/ui/AppPageHeader.vue'
import AppPanel from '@/components/ui/AppPanel.vue'
import AppState from '@/components/ui/AppState.vue'

import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppSelect from '@/components/ui/AppSelect.vue'
import { useI18n } from 'vue-i18n'
import { useMasterList } from '@/composables/useMasterList'
import { useInvoiceApi } from './composables/useInvoiceApi'
import InvoiceTable from './components/InvoiceTable.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppTextInput from '@/components/ui/AppTextInput.vue'
import AppPagination from '@/components/ui/AppPagination.vue'
const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const direction = computed(() =>
    typeof route.query.direction === 'string' ? route.query.direction : '',
)
const status = computed(() => (typeof route.query.status === 'string' ? route.query.status : ''))
const balance = computed(() => (typeof route.query.balance === 'string' ? route.query.balance : ''))
const balances = computed(() => [
    { value: '', label: t('invoices.allBalances') },
    { value: 'outstanding', label: t('invoices.outstandingOnly') },
])
const directions = computed(() => [
    { value: '', label: t('invoices.allDirections') },
    ...['receivable', 'payable'].map((value) => ({ value, label: t('invoices.' + value) })),
])
const statuses = computed(() => [
    { value: '', label: t('invoices.allStatuses') },
    ...['draft', 'issued'].map((value) => ({ value, label: t('invoices.statuses.' + value) })),
])
function filters(): Record<string, string | undefined> {
    return Object.fromEntries(
        ['purchaseOrderId', 'mitraId', 'direction', 'status', 'balance'].map((key) => [
            key,
            typeof route.query[key] === 'string' ? route.query[key] : undefined,
        ]),
    )
}
async function changeFilter(key: string, value: string): Promise<void> {
    await router.replace({ query: { ...route.query, page: undefined, [key]: value || undefined } })
}
const { response, query, search, loading, error, canCreate, refresh, searchRecords, changePage } =
    useMasterList(useInvoiceApi(), 'invoices', filters)
</script>
<template>
    <section class="min-w-0 space-y-6">
        <AppPageHeader :title="t('invoices.title')" :description="t('invoices.subtitle')"
            ><template #actions
                ><RouterLink
                    v-if="canCreate"
                    :to="{ name: 'invoice-new' }"
                    class="primary-button"
                    >{{ t('invoices.add') }}</RouterLink
                ></template
            ></AppPageHeader
        >
        <AppPanel :title="t('invoices.filters')">
            <form
                class="grid items-end gap-4 md:grid-cols-2 xl:grid-cols-4"
                @submit.prevent="searchRecords"
            >
                <div class="min-w-0">
                    <AppTextInput
                        id="invoice-search"
                        v-model="search"
                        :label="t('invoices.search')"
                        :maxlength="200"
                    />
                </div>
                <AppSelect
                    id="invoice-direction-filter"
                    renderer="nice"
                    :model-value="direction"
                    :options="directions"
                    :label="t('invoices.direction')"
                    @update:model-value="changeFilter('direction', $event)"
                />
                <AppSelect
                    id="invoice-status-filter"
                    renderer="nice"
                    :model-value="status"
                    :options="statuses"
                    :label="t('invoices.status')"
                    @update:model-value="changeFilter('status', $event)"
                />
                <AppSelect
                    id="invoice-balance-filter"
                    renderer="nice"
                    :model-value="balance"
                    :options="balances"
                    :label="t('invoices.balanceFilter')"
                    @update:model-value="changeFilter('balance', $event)"
                />
                <div class="flex flex-wrap gap-3 md:col-span-2 xl:col-span-4">
                    <AppButton type="submit">{{ t('invoices.searchAction') }}</AppButton>
                    <AppButton variant="secondary" :pending="loading" @click="refresh">{{
                        t('invoices.refresh')
                    }}</AppButton>
                </div>
            </form>
        </AppPanel>
        <AppPanel
            :title="t('invoices.results')"
            :description="
                response && !loading && !error
                    ? t('invoices.total', { count: response.meta.total })
                    : undefined
            "
            class="min-w-0"
        >
            <AppState v-if="loading" kind="loading" :message="t('invoices.loading')" />
            <AppState v-else-if="error" kind="error" :message="t(error)" @retry="refresh" />
            <template v-else-if="response"
                ><AppState
                    v-if="!response.data.length"
                    kind="empty"
                    :message="t('invoices.empty')" /><InvoiceTable v-else :invoices="response.data"
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
