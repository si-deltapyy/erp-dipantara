<script setup lang="ts">
import AppPageHeader from '@/components/ui/AppPageHeader.vue'
import AppState from '@/components/ui/AppState.vue'

import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useSessionStore } from '@/stores/session'
import { canActOnInvoice, canCreateInvoice } from '@/core/domain/invoice-policy'
import { useRecordDetail } from '@/composables/useRecordDetail'
import { useInvoiceApi } from './composables/useInvoiceApi'
import InvoiceRevisionEditor from './components/InvoiceRevisionEditor.vue'
import InvoiceEditor from './components/InvoiceEditor.vue'
const { t } = useI18n()
const route = useRoute()
const session = useSessionStore()
const {
    record: invoice,
    loading,
    error,
    refresh,
} = useRecordDetail(useInvoiceApi(), 'invoices', false)
const revising = computed(() => route.name === 'invoice-revise')
const editing = computed(() => typeof route.params.id === 'string')
const permitted = computed(() =>
    editing.value
        ? !!invoice.value &&
          canActOnInvoice(session.user, invoice.value, revising.value ? 'revise' : 'update')
        : canCreateInvoice(session.user),
)
</script>
<template>
    <section class="min-w-0 space-y-6">
        <AppPageHeader
            :title="t(revising ? 'invoices.revise' : editing ? 'invoices.edit' : 'invoices.add')"
            :description="t(revising ? 'invoices.revisionHint' : 'invoices.subtitle')"
        />
        <AppState v-if="loading" kind="loading" :message="t('invoices.loading')" />
        <AppState v-else-if="error" kind="error" :message="t(error)" @retry="refresh" />
        <InvoiceRevisionEditor
            v-else-if="permitted && revising && invoice"
            :key="invoice.id"
            :invoice="invoice"
        />
        <InvoiceEditor v-else-if="permitted" :key="invoice?.id ?? 'new'" :invoice="invoice" />
        <p v-else role="alert" class="panel">{{ t('invoices.locked') }}</p>
    </section>
</template>
