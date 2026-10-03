<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useInvoiceApi } from './composables/useInvoiceApi'
import { useMasterList } from '@/composables/useMasterList'
import InvoiceTable from './components/InvoiceTable.vue'
import AppPagination from '@/components/ui/AppPagination.vue'
import AppTextInput from '@/components/ui/AppTextInput.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppPageHeader from '@/components/ui/AppPageHeader.vue'
import AppPanel from '@/components/ui/AppPanel.vue'
import AppState from '@/components/ui/AppState.vue'
const { t } = useI18n()
const api = useInvoiceApi()
const { response, search, searchRecords, loading, error, refresh, changePage } = useMasterList(
    api,
    'invoices',
    undefined,
    {
        searchText: (invoice) =>
            [invoice.number, invoice.invoiceType, invoice.transactionId].join(' '),
        compare: (left, right) =>
            left.invoiceDate.localeCompare(right.invoiceDate) || left.id.localeCompare(right.id),
    },
)
</script>
<template>
    <section class="space-y-6">
        <AppPageHeader :title="t('invoices.title')">
            <template #actions
                ><AppButton disabled :title="t('ui.featureUnavailable')">{{
                    t('invoices.add')
                }}</AppButton></template
            >
        </AppPageHeader>
        <p role="status" class="text-sm text-muted">{{ t('ui.transactionUnavailable') }}</p>
        <AppPanel :title="t('invoices.title')">
            <template #actions
                ><AppButton variant="secondary" :pending="loading" @click="refresh">{{
                    t('invoices.refresh')
                }}</AppButton></template
            >
            <form class="mb-5 flex items-end gap-3" @submit.prevent="searchRecords">
                <AppTextInput
                    id="invoice-search"
                    v-model="search"
                    :label="t('invoices.recordSearch')"
                    :maxlength="200"
                    class="flex-1"
                />
                <AppButton type="submit" variant="secondary">{{
                    t('invoices.searchAction')
                }}</AppButton>
            </form>
            <AppState v-if="loading" kind="loading" />
            <AppState v-else-if="error" kind="error" :message="t(error)" @retry="refresh" />
            <InvoiceTable v-else-if="response" :invoices="response.data" />
            <template #footer>
                <AppPagination
                    v-if="response && !error"
                    numbered
                    :disabled="loading"
                    :page="response.meta.page"
                    :page-size="response.meta.perPage"
                    :total="response.meta.total"
                    @update:page="changePage"
                />
            </template>
        </AppPanel>
    </section>
</template>
