<script setup lang="ts">
import AppPanel from '@/components/ui/AppPanel.vue'
import AppStatusBadge from '@/components/ui/AppStatusBadge.vue'

import { computed, nextTick, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import type { Payment, PaymentInput } from '@/core/types/payment'
import type { Invoice } from '@/core/types/invoice'
import { useSessionStore } from '@/stores/session'
import { useUnsavedChanges } from '@/composables/useUnsavedChanges'
import { usePaymentForm } from '../composables/usePaymentForm'
import { usePaymentProof } from '../composables/usePaymentProof'
import PaymentFields from './PaymentFields.vue'
import DocumentPanel from '@/components/ui/DocumentPanel.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppConfirmDialog from '@/components/ui/AppConfirmDialog.vue'
const props = defineProps<{ payment?: Payment; invoice: Invoice }>()
const { t } = useI18n()
const router = useRouter()
const session = useSessionStore()
const completed = ref(false)
const formElement = ref<HTMLFormElement>()
const { draft, errors, error, pending, uncertain, dirty, permitted, save } = usePaymentForm(
    props.payment,
    (payment) => {
        completed.value = true
        void router.replace({ name: 'payment-detail', params: { id: payment.id } })
    },
    props.invoice.id,
)
const proof = reactive(
    usePaymentProof(
        () => props.invoice,
        props.payment,
        draft,
        () => permitted.value && !pending.value && !uncertain.value,
    ),
)
const disabled = computed(
    () => pending.value || uncertain.value || proof.pending || proof.uncertain || !permitted.value,
)
const { confirming, confirm, cancel } = useUnsavedChanges(
    () =>
        !completed.value &&
        permitted.value &&
        session.status === 'authenticated' &&
        (dirty.value || !!proof.file),
    () =>
        !completed.value && session.status === 'authenticated' && (pending.value || proof.pending),
)
function updateDraft(next: PaymentInput): void {
    draft.value = next
    errors.value = {}
}
async function submit(): Promise<void> {
    if (proof.pending || proof.uncertain) return
    await save()
    await nextTick()
    formElement.value?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
}
</script>
<template>
    <form ref="formElement" class="min-w-0 space-y-6" novalidate @submit.prevent="submit">
        <AppPanel :title="t('payments.invoiceContext')" class="space-y-4">
            <p class="break-words font-semibold">
                {{ invoice.number ?? invoice.purchaseOrderNumber }} / {{ invoice.counterpartyName }}
            </p>
            <AppStatusBadge>{{ t('payments.' + invoice.direction) }}</AppStatusBadge>
        </AppPanel>
        <PaymentFields
            :draft="draft"
            :invoice="invoice"
            :payment="payment"
            :errors="errors"
            :disabled="disabled"
            @change="updateDraft"
        />
        <DocumentPanel
            :documents="[]"
            :loading="false"
            list-error=""
            content-error=""
            :upload-error="proof.error"
            :file-error="proof.fileError"
            :selected-name="proof.file?.name"
            :pending="proof.pending"
            :progress="proof.progress"
            :uncertain="proof.uncertain"
            :saved="proof.saved"
            :can-read="false"
            :can-upload="proof.canUpload"
            :can-download="false"
            pending-id=""
            :copy="{
                title: 'payments.proof',
                description: 'documents.paymentHint',
                file: 'payments.proofFile',
                empty: 'documents.empty',
                hint: 'documents.paymentHint',
            }"
            @select="proof.select"
            @upload="proof.upload"
            @discard="proof.select()"
        />
        <p v-if="draft.proofDocumentId" role="status">{{ t('payments.proofReady') }}</p>
        <p v-if="errors.proofDocumentId" role="alert">{{ t(errors.proofDocumentId) }}</p>
        <p v-if="error" role="alert">{{ t(error) }}</p>
        <p v-if="uncertain" role="status">{{ t('payments.uncertain') }}</p>
        <div class="wf-form-actions">
            <RouterLink
                :to="{
                    name: payment ? 'payment-detail' : 'invoice-detail',
                    params: { id: payment?.id ?? invoice.id },
                }"
                class="secondary-button"
                >{{ t('payments.cancel') }}</RouterLink
            >
            <AppButton
                type="submit"
                :pending="pending"
                :disabled="!permitted || proof.pending || proof.uncertain"
                >{{ t(uncertain ? 'payments.retryWrite' : 'payments.save') }}</AppButton
            >
        </div>
    </form>
    <AppConfirmDialog
        :open="confirming"
        :title="t('payments.discardTitle')"
        :description="t('payments.discardDescription')"
        @confirm="confirm"
        @cancel="cancel"
    />
</template>
