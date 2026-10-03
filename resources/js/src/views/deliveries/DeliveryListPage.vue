<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useDeliveryApi } from './composables/useDeliveryApi'
import { useRecordDetail } from '@/composables/useRecordDetail'
import AppButton from '@/components/ui/AppButton.vue'
import AppPageHeader from '@/components/ui/AppPageHeader.vue'
import AppPanel from '@/components/ui/AppPanel.vue'
import AppState from '@/components/ui/AppState.vue'
const { t } = useI18n()
const api = useDeliveryApi()
const {
    record: records,
    loading,
    error,
    refresh,
} = useRecordDetail(
    {
        get: (_id, signal) =>
            api.list({ page: 1, perPage: 20, search: '', sort: '-createdAt' }, signal),
        subscribe: api.subscribe,
    },
    'deliveries',
    true,
    () => 'deliveries',
)
</script>
<template>
    <section class="space-y-6">
        <AppPageHeader :title="t('deliveries.title')">
            <template #actions
                ><AppButton disabled :title="t('ui.featureUnavailable')">{{
                    t('deliveries.add')
                }}</AppButton></template
            >
        </AppPageHeader>
        <p role="status" class="text-sm text-muted">{{ t('ui.transactionUnavailable') }}</p>
        <AppPanel :title="t('deliveries.title')">
            <template #actions
                ><AppButton variant="secondary" :pending="loading" @click="refresh">{{
                    t('deliveries.refresh')
                }}</AppButton></template
            >
            <AppState v-if="loading" kind="loading" />
            <AppState v-else-if="error" kind="error" :message="t(error)" @retry="refresh" />
            <AppState v-else-if="records" kind="empty" />
        </AppPanel>
    </section>
</template>
