<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppSelect from '@/components/ui/AppSelect.vue'
import { useI18n } from 'vue-i18n'
import { useMasterList } from '@/composables/useMasterList'
import { usePaymentApi } from './composables/usePaymentApi'
import { formatMoney } from '@/core/formatting/money'
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
    <section class="space-y-6">
        <header class="flex flex-wrap items-start justify-between gap-4">
            <div>
                <p class="text-sm font-semibold text-primary">{{ t('payments.section') }}</p>
                <h1 class="mt-1 text-2xl font-bold">{{ t('payments.title') }}</h1>
                <p class="mt-2 text-sm text-muted">{{ t('payments.subtitle') }}</p>
            </div>
            <RouterLink v-if="canCreate" :to="{ name: 'invoices' }" class="primary-button">{{
                t('payments.add')
            }}</RouterLink>
        </header>
        <div class="panel space-y-5">
            <form class="flex flex-wrap items-end gap-3" @submit.prevent="searchRecords">
                <div class="min-w-48 flex-1">
                    <AppTextInput
                        id="payment-search"
                        v-model="search"
                        :label="t('payments.search')"
                        :maxlength="200"
                    />
                </div>
                <AppSelect
                    id="payment-direction-filter"
                    :model-value="direction"
                    :options="directions"
                    :label="t('payments.direction')"
                    @update:model-value="changeFilter('direction', $event)"
                />
                <AppSelect
                    id="payment-status-filter"
                    :model-value="status"
                    :options="statuses"
                    :label="t('payments.status')"
                    @update:model-value="changeFilter('status', $event)"
                />
                <AppButton type="submit">{{ t('payments.searchAction') }}</AppButton
                ><AppButton variant="secondary" :pending="loading" @click="refresh">{{
                    t('payments.refresh')
                }}</AppButton>
            </form>
            <AppButton v-if="hasFilters" variant="secondary" @click="clearFilters">{{
                t('payments.clearFilters')
            }}</AppButton>
            <p v-if="loading" role="status">{{ t('payments.loading') }}</p>
            <p v-else-if="error" role="alert">{{ t(error) }}</p>
            <template v-else-if="response">
                <p class="text-sm text-muted">
                    {{ t('payments.total', { count: response.meta.total }) }}
                </p>
                <p v-if="!response.data.length" role="status">{{ t('payments.empty') }}</p>
                <ul class="divide-y divide-line">
                    <li
                        v-for="payment in response.data"
                        :key="payment.id"
                        class="grid gap-3 py-4 sm:grid-cols-3"
                    >
                        <div>
                            <RouterLink
                                :to="{
                                    name: 'payment-detail',
                                    params: { id: payment.id },
                                    query: $route.query,
                                }"
                                class="break-words font-semibold text-primary underline"
                                :aria-label="
                                    t('payments.open', {
                                        number: payment.invoiceNumber,
                                    })
                                "
                                >{{ payment.invoiceNumber }}</RouterLink
                            >
                            <p>{{ payment.counterpartyName }}</p>
                        </div>
                        <p>
                            {{ t('payments.' + payment.direction) }} /
                            {{ t('payments.statuses.' + payment.status) }}
                        </p>
                        <p>{{ formatMoney(payment.creditAmount) }}</p>
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
