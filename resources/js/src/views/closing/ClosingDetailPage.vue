<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useSessionStore } from '@/stores/session'
import { evaluateRecordAccess } from '@/core/domain/record-policy'
import { useRecordDetail } from '@/composables/useRecordDetail'
import { useClosingApi } from './composables/useClosingApi'
import ClosingEligibilityPanel from './components/ClosingEligibilityPanel.vue'
import AppButton from '@/components/ui/AppButton.vue'
const { t } = useI18n()
const session = useSessionStore()
const {
    record: closing,
    loading,
    error,
    refresh,
} = useRecordDetail(useClosingApi(), 'closings', false)
</script>
<template>
    <section class="space-y-6">
        <header class="flex flex-wrap items-center justify-between gap-3">
            <h1 class="text-2xl font-bold">{{ t('closings.detail') }}</h1>
            <RouterLink :to="{ name: 'closings', query: $route.query }" class="secondary-button">{{
                t('closings.back')
            }}</RouterLink>
        </header>
        <p v-if="loading" role="status">{{ t('closings.loading') }}</p>
        <div v-else-if="error" class="panel space-y-3" role="alert">
            <p>{{ t(error) }}</p>
            <AppButton @click="refresh">{{ t('closings.refresh') }}</AppButton>
        </div>
        <template v-else-if="closing">
            <div class="panel space-y-4">
                <h2 class="break-words text-lg font-semibold">{{ closing.purchaseOrderNumber }}</h2>
                <p>{{ t('closings.statuses.' + closing.status) }}</p>
                <p class="break-words">{{ closing.notes ?? t('closings.noNotes') }}</p>
                <p v-if="closing.rejectionReason" class="break-words">
                    {{ closing.rejectionReason }}
                </p>
                <p v-if="closing.status === 'requested'">{{ t('closings.requestDescription') }}</p>
                <RouterLink
                    v-if="
                        evaluateRecordAccess(session.user, 'purchase-orders.read', closing) ===
                        'allowed'
                    "
                    :to="{ name: 'purchase-order-detail', params: { id: closing.purchaseOrderId } }"
                    class="secondary-button"
                    >{{ t('closings.openPurchaseOrder') }}</RouterLink
                >
            </div>
            <ClosingEligibilityPanel :purchase-order-id="closing.purchaseOrderId" />
        </template>
    </section>
</template>
