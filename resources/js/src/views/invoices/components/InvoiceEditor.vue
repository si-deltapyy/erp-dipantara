<script setup lang="ts">
import AppPanel from '@/components/ui/AppPanel.vue'

import { computed, nextTick, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import type { Invoice, InvoiceInput } from '@/core/types/invoice'
import { useSessionStore } from '@/stores/session'
import { useUnsavedChanges } from '@/composables/useUnsavedChanges'
import { useInvoiceForm } from '../composables/useInvoiceForm'
import ApprovedPurchaseOrderLookup from '@/views/orders/components/ApprovedPurchaseOrderLookup.vue'
import MasterLookup from '@/views/master-data/components/MasterLookup.vue'
import InvoiceTerms from './InvoiceTerms.vue'
import AppTextInput from '@/components/ui/AppTextInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppConfirmDialog from '@/components/ui/AppConfirmDialog.vue'
const props = defineProps<{ invoice?: Invoice }>()
const { t } = useI18n()
const router = useRouter()
const session = useSessionStore()
const completed = ref(false)
const formElement = ref<HTMLFormElement>()
const { draft, errors, error, pending, uncertain, dirty, permitted, save } = useInvoiceForm(
    props.invoice,
    (invoice) => {
        completed.value = true
        void router.replace({ name: 'invoice-detail', params: { id: invoice.id } })
    },
)
const disabled = computed(() => pending.value || uncertain.value || !permitted.value)
const kinds = computed(() =>
    ['down_payment', 'settlement'].map((value) => ({ value, label: t('invoices.' + value) })),
)
function changeKind(value: string): void {
    if (value === 'down_payment' || value === 'settlement') update('kind', value)
}
const directions = computed(() =>
    ['receivable', 'payable'].map((value) => ({ value, label: t('invoices.' + value) })),
)
const { confirming, confirm, cancel } = useUnsavedChanges(
    () => !completed.value && permitted.value && session.status === 'authenticated' && dirty.value,
    () => !completed.value && session.status === 'authenticated' && pending.value,
)
function update<K extends keyof InvoiceInput>(field: K, value: InvoiceInput[K]): void {
    draft.value = { ...draft.value, [field]: value }
    errors.value = Object.fromEntries(
        Object.entries(errors.value).filter(
            ([key]) => key !== field && !key.startsWith(field + '.'),
        ),
    )
}
function changeDirection(value: string): void {
    if (value !== 'receivable' && value !== 'payable') return
    draft.value = { ...draft.value, direction: value, mitraId: null }
}
async function submit(): Promise<void> {
    await save()
    await nextTick()
    formElement.value?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
}
</script>
<template>
    <form ref="formElement" class="min-w-0 space-y-6" novalidate @submit.prevent="submit">
        <AppPanel :title="t('invoices.context')" class="space-y-5">
            <ApprovedPurchaseOrderLookup
                v-if="!invoice"
                id="invoice-po"
                :model-value="draft.purchaseOrderId"
                :label="t('invoices.purchaseOrder')"
                :error="errors.purchaseOrderId ? t(errors.purchaseOrderId) : ''"
                :disabled="disabled"
                @update:model-value="update('purchaseOrderId', $event)"
            />
            <p v-else>{{ invoice.purchaseOrderNumber }} / {{ invoice.counterpartyName }}</p>
            <div class="grid gap-4 sm:grid-cols-2">
                <AppSelect
                    id="invoice-direction"
                    renderer="nice"
                    :model-value="draft.direction"
                    :options="directions"
                    :label="t('invoices.direction')"
                    :disabled="disabled || !!invoice"
                    @update:model-value="changeDirection"
                />
                <MasterLookup
                    v-if="draft.direction === 'payable'"
                    id="invoice-mitra"
                    kind="mitra"
                    :label="t('invoices.mitra')"
                    :model-value="draft.mitraId ?? ''"
                    :selected-label="invoice?.counterpartyName"
                    :disabled="disabled || !!invoice"
                    :error="errors.mitraId ? t(errors.mitraId) : ''"
                    @update:model-value="update('mitraId', $event)"
                />
                <AppTextInput
                    id="invoice-date"
                    type="date"
                    :model-value="draft.invoiceDate"
                    :label="t('invoices.invoiceDate')"
                    :error="errors.invoiceDate ? t(errors.invoiceDate) : ''"
                    :disabled="disabled"
                    @update:model-value="update('invoiceDate', $event)"
                />
            </div>
            <AppSelect
                id="invoice-kind"
                renderer="nice"
                :model-value="draft.kind"
                :options="kinds"
                :label="t('invoices.kind')"
                :disabled="disabled || !!invoice"
                @update:model-value="changeKind"
            />
        </AppPanel>
        <InvoiceTerms
            :terms="draft.terms"
            :errors="errors"
            :disabled="disabled"
            @change="update('terms', $event)"
        />
        <AppPanel :title="t('invoices.notes')">
            <AppTextInput
                id="invoice-notes"
                :label="t('invoices.notes')"
                :model-value="draft.notes ?? ''"
                :maxlength="2000"
                :disabled="disabled"
                @update:model-value="update('notes', $event || null)"
            />
        </AppPanel>
        <p v-if="error" role="alert" class="text-red-700">{{ t(error) }}</p>
        <p v-if="uncertain" role="status">{{ t('invoices.uncertain') }}</p>
        <div class="wf-form-actions">
            <RouterLink
                :to="{
                    name: invoice ? 'invoice-detail' : 'invoices',
                    params: invoice ? { id: invoice.id } : {},
                }"
                class="secondary-button"
                >{{ t('invoices.cancel') }}</RouterLink
            >
            <AppButton type="submit" :pending="pending" :disabled="!permitted">{{
                t(uncertain ? 'invoices.retryWrite' : 'invoices.save')
            }}</AppButton>
        </div>
    </form>
    <AppConfirmDialog
        :open="confirming"
        :title="t('invoices.discardTitle')"
        :description="t('invoices.discardDescription')"
        @confirm="confirm"
        @cancel="cancel"
    />
</template>
