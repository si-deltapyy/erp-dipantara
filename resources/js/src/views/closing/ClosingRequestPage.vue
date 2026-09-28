<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useRecordDetail } from '@/composables/useRecordDetail'
import { useClosingApi } from './composables/useClosingApi'
import ClosingRequestForm from './components/ClosingRequestForm.vue'
import AppButton from '@/components/ui/AppButton.vue'
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
    <section class="mx-auto max-w-4xl space-y-6">
        <h1 class="text-2xl font-bold">{{ t('closings.request') }}</h1>
        <p v-if="loading" role="status">{{ t('closings.loading') }}</p>
        <div v-else-if="error" class="panel space-y-3" role="alert">
            <p>{{ t(error) }}</p>
            <AppButton @click="refresh">{{ t('closings.refresh') }}</AppButton>
        </div>
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
