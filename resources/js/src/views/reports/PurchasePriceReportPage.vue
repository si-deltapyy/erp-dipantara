<script setup lang="ts">
import AppPageHeader from '@/components/ui/AppPageHeader.vue'
import AppPanel from '@/components/ui/AppPanel.vue'
import AppState from '@/components/ui/AppState.vue'

import { useI18n } from 'vue-i18n'
import { usePurchasePriceReport } from './composables/usePurchasePriceReport'
import ReportExport from './components/ReportExport.vue'
import ReportFilters from './components/ReportFilters.vue'
import PurchasePriceTable from './components/PurchasePriceTable.vue'
import AppPagination from '@/components/ui/AppPagination.vue'
import AppButton from '@/components/ui/AppButton.vue'
const { t } = useI18n()
const { response, query, loading, error, refresh, changePage } = usePurchasePriceReport()
</script>
<template>
    <section class="min-w-0 space-y-6">
        <AppPageHeader :title="t('reports.prices')" :description="t('reports.priceNotice')" />
        <AppPanel :title="t('reports.filters')" :description="t('reports.scopeHint')"
            ><ReportFilters
        /></AppPanel>
        <AppPanel
            :title="t('reports.priceResults')"
            :description="
                response && !loading && !error
                    ? t('reports.resultCount', { count: response.meta.total })
                    : undefined
            "
            class="min-w-0"
        >
            <template #actions
                ><AppButton variant="secondary" :pending="loading" @click="refresh">{{
                    t('reports.refresh')
                }}</AppButton></template
            >
            <AppState v-if="loading" kind="loading" :message="t('reports.loading')" />
            <AppState v-else-if="error" kind="error" :message="t(error)" @retry="refresh" />
            <PurchasePriceTable v-else-if="response" :rows="response.data" />
            <template v-if="response && !loading && !error" #footer
                ><AppPagination
                    numbered
                    :page="query.page"
                    :page-size="response.meta.perPage"
                    :total="response.meta.total"
                    @update:page="changePage"
            /></template>
        </AppPanel>
        <ReportExport kind="purchase_prices" />
    </section>
</template>
