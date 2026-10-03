<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { usePaymentApi } from './composables/usePaymentApi'
import { useMasterList } from '@/composables/useMasterList'
import PaymentTable from './components/PaymentTable.vue'
import AppPagination from '@/components/ui/AppPagination.vue'
import AppTextInput from '@/components/ui/AppTextInput.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppPageHeader from '@/components/ui/AppPageHeader.vue'
import AppPanel from '@/components/ui/AppPanel.vue'
import AppState from '@/components/ui/AppState.vue'
const { t } = useI18n()
const api = usePaymentApi()
const { response, search, searchRecords, loading, error, refresh, changePage } = useMasterList(
    api,
    'payments',
    undefined,
    {
        searchText: (payment) =>
            [
                payment.purchaseOrderNumber,
                payment.buyerName,
                payment.buyerTerm,
                payment.mitraTerm,
            ].join(' '),
        compare: (left, right) =>
            left.paymentDate.localeCompare(right.paymentDate) || left.id.localeCompare(right.id),
    },
    'payments.read.all',
)
</script>
<template>
    <section class="space-y-6">
        <AppPageHeader :title="t('payments.title')">
            <template #actions
                ><AppButton disabled :title="t('ui.featureUnavailable')">{{
                    t('payments.add')
                }}</AppButton></template
            >
        </AppPageHeader>
        <p role="status" class="text-sm text-muted">{{ t('ui.transactionUnavailable') }}</p>
        <AppPanel :title="t('payments.title')">
            <template #actions
                ><AppButton variant="secondary" :pending="loading" @click="refresh">{{
                    t('payments.refresh')
                }}</AppButton></template
            >
            <form class="mb-5 flex items-end gap-3" @submit.prevent="searchRecords">
                <AppTextInput
                    id="payment-search"
                    v-model="search"
                    :label="t('payments.recordSearch')"
                    :maxlength="200"
                    class="flex-1"
                />
                <AppButton type="submit" variant="secondary">{{
                    t('payments.searchAction')
                }}</AppButton>
            </form>
            <AppState v-if="loading" kind="loading" />
            <AppState v-else-if="error" kind="error" :message="t(error)" @retry="refresh" />
            <PaymentTable v-else-if="response" :payments="response.data" />
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
