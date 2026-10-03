<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { usePaymentApi } from './composables/usePaymentApi'
import { useRecordDetail } from '@/composables/useRecordDetail'
import AppButton from '@/components/ui/AppButton.vue'
import AppPageHeader from '@/components/ui/AppPageHeader.vue'
import AppPanel from '@/components/ui/AppPanel.vue'
import AppState from '@/components/ui/AppState.vue'
const { t } = useI18n()
const api = usePaymentApi()
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
    'payments',
    true,
    () => 'payments',
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
            <AppState v-if="loading" kind="loading" />
            <AppState v-else-if="error" kind="error" :message="t(error)" @retry="refresh" />
            <AppState v-else-if="records" kind="empty" />
        </AppPanel>
    </section>
</template>
