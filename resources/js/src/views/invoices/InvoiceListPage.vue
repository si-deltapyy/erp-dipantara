<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useMasterList } from '@/composables/useMasterList'
import { useInvoiceApi } from './composables/useInvoiceApi'
import { formatMoney } from '@/core/formatting/money'
import AppButton from '@/components/ui/AppButton.vue'
import AppTextInput from '@/components/ui/AppTextInput.vue'
import AppPagination from '@/components/ui/AppPagination.vue'
const { t } = useI18n()
const { response, query, search, loading, error, canCreate, refresh, searchRecords, changePage } =
    useMasterList(useInvoiceApi(), 'invoices')
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
                <AppButton type="submit">{{ t('invoices.searchAction') }}</AppButton
                ><AppButton variant="secondary" :pending="loading" @click="refresh">{{
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
                        <p>{{ formatMoney(invoice.totalAmount) }}</p>
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
