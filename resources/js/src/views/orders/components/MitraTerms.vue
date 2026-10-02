<script setup lang="ts">
import { formatMoney } from '@/core/formatting/money'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMitraTerms } from '../composables/useMitraTerms'
import AppButton from '@/components/ui/AppButton.vue'
const props = defineProps<{ purchaseOrderId: string; mitraId: string }>()
const { t } = useI18n()
const { invoices, error, loading, hasMore, load } = useMitraTerms(
    computed(() => ({ purchaseOrderId: props.purchaseOrderId, mitraId: props.mitraId })),
)
</script>
<template>
    <div class="space-y-2 border-t border-line pt-3">
        <h4 class="font-semibold">{{ t('assignments.terms') }}</h4>
        <p v-if="loading" role="status">{{ t('assignments.loading') }}</p>
        <div v-else-if="error" role="alert">
            <p>{{ t(error) }}</p>
            <AppButton variant="secondary" @click="load()">{{ t('orders.refresh') }}</AppButton>
        </div>
        <p v-else-if="!invoices.length" class="text-sm text-muted">
            {{ t('assignments.noTerms') }}
        </p>
        <div v-for="invoice in invoices" :key="invoice.id" class="space-y-1 text-sm">
            <RouterLink
                :to="{ name: 'invoice-detail', params: { id: invoice.id } }"
                class="font-semibold text-primary underline"
                >{{ invoice.number ?? t('invoices.statuses.draft') }}</RouterLink
            >
            <p v-for="term in invoice.terms" :key="term.label">
                {{ term.label }}: {{ formatMoney(term.amount) }} /
                {{ term.dueDate ?? t('assignments.noDueDate') }}
            </p>
        </div>
        <AppButton v-if="hasMore" variant="secondary" :pending="loading" @click="load(true)">{{
            t('orders.more')
        }}</AppButton>
    </div>
</template>
