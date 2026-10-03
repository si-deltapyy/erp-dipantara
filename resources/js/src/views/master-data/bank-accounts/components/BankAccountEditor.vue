<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { nextTick, ref } from 'vue'
import type { BankAccount } from '@/core/types/bank-account'
import { useBankAccountForm } from '../composables/useBankAccountForm'
import { useUnsavedChanges } from '@/composables/useUnsavedChanges'
import BankAccountFields from './BankAccountFields.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppConfirmDialog from '@/components/ui/AppConfirmDialog.vue'
import { useSessionStore } from '@/stores/session'
const props = defineProps<{ bankAccount?: BankAccount }>()
const emit = defineEmits<{ saved: []; close: [] }>()
const { t } = useI18n()
const session = useSessionStore()
const form = ref<HTMLFormElement>()
const { draft, errors, error, pending, uncertain, dirty, save } = useBankAccountForm(
    props.bankAccount,
    () => emit('saved'),
)
const { confirming, requestDiscard, confirm, cancel } = useUnsavedChanges(
    () => dirty.value,
    () => pending.value && session.status === 'authenticated',
)
function close(): void {
    requestDiscard(() => emit('close'))
}
async function submit(): Promise<void> {
    await save()
    await nextTick()
    form.value?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
}
</script>
<template>
    <AppModal
        :open="true"
        :title="t(bankAccount ? 'bank-accounts.edit' : 'bank-accounts.add')"
        initial-focus="#bank-account-bankName"
        :busy="pending"
        @close="close"
    >
        <form ref="form" class="space-y-5" novalidate @submit.prevent="submit">
            <BankAccountFields
                v-model="draft"
                :errors="errors"
                :disabled="pending || uncertain"
                :editing="!!bankAccount"
            />
            <div
                v-if="error"
                role="alert"
                class="rounded-md border border-danger/20 bg-danger-light p-3 text-sm text-danger"
            >
                <p>{{ t(error) }}</p>
                <p v-if="error === 'bank-accounts.errors.conflict'" class="mt-2">
                    {{ t('bank-accounts.conflictHint') }}
                </p>
                <p v-if="uncertain" class="mt-2">{{ t('bank-accounts.uncertain') }}</p>
            </div>
            <div class="wf-form-actions">
                <AppButton variant="secondary" :disabled="pending" @click="close">{{
                    t('bank-accounts.cancel')
                }}</AppButton>
                <AppButton type="submit" :pending="pending">{{
                    t(uncertain ? 'bank-accounts.retry' : 'bank-accounts.save')
                }}</AppButton>
            </div>
        </form>
    </AppModal>
    <AppConfirmDialog
        :open="confirming"
        :title="t('bank-accounts.discardTitle')"
        :description="t('bank-accounts.discardDescription')"
        @confirm="confirm"
        @cancel="cancel"
    />
</template>
