<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useSessionStore } from '@/stores/session'
import { hasBusinessPermission } from '@/core/domain/record-policy'
import { useRecordDetail } from '@/composables/useRecordDetail'
import { useClosingApi } from '../composables/useClosingApi'
import InvoiceBalancePanel from '@/views/invoices/components/InvoiceBalancePanel.vue'
import AppButton from '@/components/ui/AppButton.vue'
const props = defineProps<{ purchaseOrderId: string }>()
const { t } = useI18n()
const session = useSessionStore()
const api = useClosingApi()
const {
    record: eligibility,
    loading,
    error,
    refresh,
} = useRecordDetail(
    { get: api.eligibility, subscribe: api.subscribe },
    'closings',
    true,
    () => props.purchaseOrderId,
)
</script>
<template>
    <section class="panel space-y-4" aria-labelledby="closing-eligibility-title">
        <h2 id="closing-eligibility-title" class="text-lg font-semibold">
            {{ t('closings.eligibility') }}
        </h2>
        <p class="text-sm text-muted">{{ t('closings.assumption') }}</p>
        <p v-if="loading" role="status">{{ t('closings.loading') }}</p>
        <div v-else-if="error" role="alert" class="space-y-3">
            <p>{{ t(error) }}</p>
            <AppButton @click="refresh">{{ t('closings.refresh') }}</AppButton>
        </div>
        <template v-else-if="eligibility">
            <p class="font-semibold" role="status">
                {{ t(eligibility.eligible ? 'closings.eligible' : 'closings.blocked') }}
            </p>
            <p class="break-words text-sm text-muted">
                {{ t('closings.evaluatedAt', { date: eligibility.evaluatedAt }) }}
            </p>
            <ul v-if="eligibility.reasons.length" class="list-disc space-y-2 pl-5">
                <li v-for="reason in eligibility.reasons" :key="reason">
                    {{ t('closings.reasons.' + reason) }}
                </li>
            </ul>
            <dl class="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div v-for="(quantity, kind) in eligibility.quantities" :key="kind">
                    <dt class="text-sm text-muted">{{ t('closings.quantities.' + kind) }}</dt>
                    <dd class="text-lg font-semibold">
                        {{ t('closings.quantity', { count: quantity }) }}
                    </dd>
                </div>
            </dl>
            <p>{{ t('closings.openWork', { count: eligibility.openWorkCount }) }}</p>
            <div class="grid gap-4 lg:grid-cols-2">
                <InvoiceBalancePanel
                    v-for="direction in ['receivable', 'payable'] as const"
                    :key="direction"
                    :direction="direction"
                    :balance="eligibility.summary[direction]"
                />
            </div>
            <div class="flex flex-wrap gap-3">
                <RouterLink
                    v-if="eligibility.allowedActions.includes('request')"
                    :to="{ name: 'closing-new', query: { purchaseOrderId } }"
                    class="primary-button"
                    >{{ t('closings.request') }}</RouterLink
                >
                <RouterLink
                    :to="{ name: 'closings', query: { purchaseOrderId } }"
                    class="secondary-button"
                    >{{ t('closings.history') }}</RouterLink
                >
                <AppButton @click="refresh">{{ t('closings.refresh') }}</AppButton>
                <RouterLink
                    v-if="hasBusinessPermission(session.user, 'deliveries.read')"
                    :to="{ name: 'deliveries', query: { purchaseOrderId } }"
                    class="secondary-button"
                    >{{ t('closings.deliveries') }}</RouterLink
                >
                <RouterLink
                    v-if="hasBusinessPermission(session.user, 'invoices.read')"
                    :to="{ name: 'invoices', query: { purchaseOrderId } }"
                    class="secondary-button"
                    >{{ t('closings.invoices') }}</RouterLink
                >
            </div>
        </template>
    </section>
</template>
