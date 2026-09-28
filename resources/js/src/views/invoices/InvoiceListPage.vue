<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppSelect from '@/components/ui/AppSelect.vue'
import { useI18n } from 'vue-i18n'
import { useMasterList } from '@/composables/useMasterList'
import { useInvoiceApi } from './composables/useInvoiceApi'
import { formatMoney } from '@/core/formatting/money'
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
    <section class="space-y-6">
        <header class="flex flex-wrap items-start justify-between gap-4">
            <div>
                <p class="text-sm font-semibold text-primary">{{ t('invoices.section') }}</p>
                <h1 class="mt-1 text-2xl font-bold">{{ t('invoices.title') }}</h1>
                <p class="mt-2 text-sm text-muted">{{ t('invoices.subtitle') }}</p>
            </div>
            <RouterLink v-if="canCreate" :to="{ name: 'invoice-new' }" class="primary-button">{{
                t('invoices.add')
            }}</RouterLink>
        </header>
        <div class="panel space-y-5">
            <form class="flex flex-wrap items-end gap-3" @submit.prevent="searchRecords">
                <div class="min-w-48 flex-1">
                    <AppTextInput
                        id="invoice-search"
                        v-model="search"
                        :label="t('invoices.search')"
                        :maxlength="200"
                    />
                </div>
                <AppSelect
                    id="invoice-direction-filter"
                    :model-value="direction"
                    :options="directions"
                    :label="t('invoices.direction')"
                    @update:model-value="changeFilter('direction', $event)"
                />
                <AppSelect
                    id="invoice-status-filter"
                    :model-value="status"
                    :options="statuses"
                    :label="t('invoices.status')"
                    @update:model-value="changeFilter('status', $event)"
                />
                <AppSelect
                    id="invoice-balance-filter"
                    :model-value="balance"
                    :options="balances"
                    :label="t('invoices.balanceFilter')"
                    @update:model-value="changeFilter('balance', $event)"
                />
                <AppButton type="submit">{{ t('invoices.searchAction') }}</AppButton>
                <AppButton variant="secondary" :pending="loading" @click="refresh">{{
                    t('invoices.refresh')
                }}</AppButton>
            </form>
            <p v-if="loading" role="status">{{ t('invoices.loading') }}</p>
            <p v-else-if="error" role="alert">{{ t(error) }}</p>
            <template v-else-if="response">
                <p class="text-sm text-muted">
                    {{ t('invoices.total', { count: response.meta.total }) }}
                </p>
                <p v-if="!response.data.length" role="status">{{ t('invoices.empty') }}</p>
                <ul class="divide-y divide-line">
                    <li
                        v-for="invoice in response.data"
                        :key="invoice.id"
                        class="grid gap-3 py-4 sm:grid-cols-3"
                    >
                        <div>
                            <RouterLink
                                :to="{
                                    name: 'invoice-detail',
                                    params: { id: invoice.id },
                                    query: $route.query,
                                }"
                                class="break-words font-semibold text-primary underline"
                                :aria-label="
                                    t('invoices.open', {
                                        number: invoice.number ?? invoice.purchaseOrderNumber,
                                    })
                                "
                                >{{ invoice.number ?? invoice.purchaseOrderNumber }}</RouterLink
                            >
                            <p>{{ invoice.counterpartyName }}</p>
                        </div>
                        <p>
                            {{ t('invoices.' + invoice.direction) }} /
                            {{ t('invoices.statuses.' + invoice.status) }}
                        </p>
                        <div>
                            <p>{{ formatMoney(invoice.totalAmount) }}</p>
                            <p v-if="invoice.issuedRevisionNumber" class="text-sm text-muted">
                                {{
                                    t('invoices.remainingBalance', {
                                        amount: formatMoney(invoice.outstandingAmount),
                                    })
                                }}
                            </p>
                        </div>
                    </li>
                </ul>
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
