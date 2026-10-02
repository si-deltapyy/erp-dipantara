<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useGradingList } from './composables/useGradingList'
import AppButton from '@/components/ui/AppButton.vue'
import AppPageHeader from '@/components/ui/AppPageHeader.vue'
import AppPanel from '@/components/ui/AppPanel.vue'
import AppState from '@/components/ui/AppState.vue'
const { t } = useI18n()
const { record: records, loading, error, refresh } = useGradingList()
</script>
<template>
    <section class="space-y-6">
        <AppPageHeader :title="t('gradings.title')">
            <template #actions
                ><AppButton disabled :title="t('ui.featureUnavailable')">{{
                    t('gradings.add')
                }}</AppButton></template
            >
        </AppPageHeader>
        <p role="status" class="text-sm text-muted">{{ t('ui.transactionUnavailable') }}</p>
        <AppPanel :title="t('gradings.title')">
            <template #actions
                ><AppButton variant="secondary" :pending="loading" @click="refresh">{{
                    t('gradings.refresh')
                }}</AppButton></template
            >
            <AppState v-if="loading" kind="loading" />
            <AppState v-else-if="error" kind="error" :message="t(error)" @retry="refresh" />
            <AppState v-else-if="records" kind="empty" />
        </AppPanel>
    </section>
</template>
