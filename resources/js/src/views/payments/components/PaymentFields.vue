<script setup lang="ts">
import AppPanel from '@/components/ui/AppPanel.vue'

import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Payment, PaymentInput } from '@/core/types/payment'
import type { Invoice } from '@/core/types/invoice'
import PaymentAccountLookup from './PaymentAccountLookup.vue'
import AppTextInput from '@/components/ui/AppTextInput.vue'
const props = defineProps<{
    draft: PaymentInput
    invoice: Invoice
    payment?: Payment
    errors: Partial<Record<keyof PaymentInput, string>>
    disabled: boolean
}>()
const emit = defineEmits<{ change: [draft: PaymentInput] }>()
const { t } = useI18n()
const counterparty = computed(() => (props.invoice.direction === 'receivable' ? 'buyer' : 'mitra'))
function change<K extends keyof PaymentInput>(key: K, value: PaymentInput[K]): void {
    emit('change', { ...props.draft, [key]: value })
}
</script>
<template>
    <div class="space-y-6">
        <AppPanel :title="t('payments.accounts')" :description="t('payments.' + invoice.direction)"
            ><div class="grid min-w-0 gap-6 lg:grid-cols-2">
                <PaymentAccountLookup
                    id="payment-source"
                    :invoice-id="invoice.id"
                    :owner-type="invoice.direction === 'receivable' ? counterparty : 'company'"
                    :model-value="draft.sourceAccountId"
                    :selected-label="payment?.sourceAccountLabel"
                    :label="t('payments.sourceAccount')"
                    :disabled="disabled"
                    :error="errors.sourceAccountId ? t(errors.sourceAccountId) : ''"
                    @update:model-value="change('sourceAccountId', $event)"
                />
                <PaymentAccountLookup
                    id="payment-destination"
                    :invoice-id="invoice.id"
                    :owner-type="invoice.direction === 'payable' ? counterparty : 'company'"
                    :model-value="draft.destinationAccountId"
                    :selected-label="payment?.destinationAccountLabel"
                    :label="t('payments.destinationAccount')"
                    :disabled="disabled"
                    :error="errors.destinationAccountId ? t(errors.destinationAccountId) : ''"
                    @update:model-value="change('destinationAccountId', $event)"
                /></div
        ></AppPanel>
        <AppPanel :title="t('payments.amounts')"
            ><div class="grid min-w-0 gap-5 lg:grid-cols-2">
                <AppTextInput
                    id="payment-date"
                    type="date"
                    :model-value="draft.paymentDate"
                    :label="t('payments.paymentDate')"
                    :disabled="disabled"
                    :error="errors.paymentDate ? t(errors.paymentDate) : ''"
                    @update:model-value="change('paymentDate', $event)"
                />
                <AppTextInput
                    v-for="field in [
                        'cashAmount',
                        'withholdingAmount',
                        'roundingAdjustment',
                    ] as const"
                    :id="'payment-' + field"
                    :key="field"
                    :model-value="draft[field]"
                    :label="t('payments.' + field)"
                    :disabled="disabled"
                    :maxlength="20"
                    :error="errors[field] ? t(errors[field]) : ''"
                    @update:model-value="change(field, $event)"
                /></div
        ></AppPanel>
        <AppPanel :title="t('payments.notes')">
            <AppTextInput
                id="payment-notes"
                :model-value="draft.notes ?? ''"
                :label="t('payments.notes')"
                :disabled="disabled"
                :maxlength="2000"
                @update:model-value="change('notes', $event || null)"
            />
        </AppPanel>
    </div>
</template>
