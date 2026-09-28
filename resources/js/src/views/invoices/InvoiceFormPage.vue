<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useSessionStore } from '@/stores/session'
import { canActOnInvoice, canCreateInvoice } from '@/core/domain/invoice-policy'
import { useRecordDetail } from '@/composables/useRecordDetail'
import { useInvoiceApi } from './composables/useInvoiceApi'
import InvoiceEditor from './components/InvoiceEditor.vue'
import AppButton from '@/components/ui/AppButton.vue'
const { t } = useI18n()
const route = useRoute()
const session = useSessionStore()
const {
    record: invoice,
    loading,
    error,
    refresh,
} = useRecordDetail(useInvoiceApi(), 'invoices', false)
const editing = computed(() => typeof route.params.id === 'string')
const permitted = computed(() =>
    editing.value
        ? !!invoice.value && canActOnInvoice(session.user, invoice.value, 'update')
        : canCreateInvoice(session.user),
)
</script>
<template>
    <section class="mx-auto max-w-4xl space-y-6">
        <h1 class="text-2xl font-bold">
            {{ t(editing ? 'invoices.edit' : 'invoices.add') }}
        </h1>
        <p v-if="loading" role="status">{{ t('invoices.loading') }}</p>
        <div v-else-if="error" role="alert" class="panel space-y-3">
            <p>{{ t(error) }}</p>
            <AppButton @click="refresh">{{ t('invoices.refresh') }}</AppButton>
        </div>
        <InvoiceEditor v-else-if="permitted" :key="invoice?.id ?? 'new'" :invoice="invoice" />
        <p v-else role="alert" class="panel">{{ t('invoices.locked') }}</p>
    </section>
</template>
