<script setup lang="ts">
import AppPageHeader from '@/components/ui/AppPageHeader.vue'
import AppState from '@/components/ui/AppState.vue'

import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useRecordDetail } from '@/composables/useRecordDetail'
import { useClosingApi } from './composables/useClosingApi'
import ClosingRequestForm from './components/ClosingRequestForm.vue'
const route = useRoute()
const { t } = useI18n()
const api = useClosingApi()
const { record, loading, error, refresh } = useRecordDetail(
    { get: api.eligibility, subscribe: api.subscribe },
    'closings',
    false,
    () =>
        typeof route.query.purchaseOrderId === 'string' ? route.query.purchaseOrderId : undefined,
)
</script>
<template>
    <section class="min-w-0 space-y-6">
        <AppPageHeader
            :title="t('closings.request')"
            :description="t('closings.requestDescription')"
        />
        <AppState v-if="loading" kind="loading" :message="t('closings.loading')" />
        <AppState v-else-if="error" kind="error" :message="t(error)" @retry="refresh" />
        <ClosingRequestForm
            v-else-if="record"
            :key="record.purchaseOrderId"
            :eligibility="record"
        />
        <p v-else>{{ t('closings.choosePurchaseOrder') }}</p>
        <RouterLink :to="{ name: 'purchase-orders' }" class="secondary-button">{{
            t('closings.purchaseOrders')
        }}</RouterLink>
    </section>
</template>
