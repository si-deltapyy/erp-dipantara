<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useProductionReport } from './composables/useProductionReport'
import ReportFilters from './components/ReportFilters.vue'
import ProductionTable from './components/ProductionTable.vue'
import AppPagination from '@/components/ui/AppPagination.vue'
import AppButton from '@/components/ui/AppButton.vue'
const { t } = useI18n()
const { response, query, loading, error, refresh, changePage } = useProductionReport()
</script>
<template>
    <section class="space-y-6">
        <h1 class="text-2xl font-bold">{{ t('production.title') }}</h1>
        <p class="text-sm text-muted">{{ t('production.simulation') }}</p>
        <div class="panel space-y-5">
            <ReportFilters />
            <AppButton variant="secondary" :pending="loading" @click="refresh">{{
                t('purchase-orders.refresh')
            }}</AppButton>
            <p v-if="loading" role="status">{{ t('purchase-orders.loading') }}</p>
            <p v-else-if="error" role="alert">{{ t(error) }}</p>
            <template v-else-if="response">
                <ProductionTable :rows="response.data" />
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
