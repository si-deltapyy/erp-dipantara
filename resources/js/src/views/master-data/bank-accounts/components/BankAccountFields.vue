<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { BankAccountInput } from '@/core/types/bank-account'
import type { BankAccountErrors } from '@/core/domain/bank-account-validation'
import { bankAccountFieldLimits } from '@/core/domain/bank-account-validation'
import AppTextInput from '@/components/ui/AppTextInput.vue'
import BankAccountOwnerFields from './BankAccountOwnerFields.vue'
const props = defineProps<{
    modelValue: BankAccountInput
    errors: BankAccountErrors
    disabled: boolean
    editing: boolean
}>()
const emit = defineEmits<{ 'update:modelValue': [value: BankAccountInput] }>()
const { t, te } = useI18n()
function update(field: keyof typeof bankAccountFieldLimits, value: string): void {
    emit('update:modelValue', { ...props.modelValue, [field]: value })
}
function fieldError(field: keyof typeof bankAccountFieldLimits): string | undefined {
    const message = props.errors[field]
    return message
        ? te(message)
            ? t(message)
            : message === 'contract.invalid'
              ? t('bank-accounts.invalid')
              : message
        : undefined
}
</script>
<template>
    <div class="space-y-4">
        <p class="text-sm text-muted">{{ t('bank-accounts.requiredHint') }}</p>
        <AppTextInput
            v-for="(limit, field) in bankAccountFieldLimits"
            :id="'bank-account-' + field"
            :key="field"
            :model-value="modelValue[field]"
            :label="t('bank-accounts.' + field)"
            :error="fieldError(field)"
            :disabled="disabled"
            :maxlength="limit"
            autocomplete="off"
            aria-required="true"
            @update:model-value="update(field, $event)"
        />
        <BankAccountOwnerFields
            :model-value="modelValue"
            :errors="errors"
            :disabled="disabled"
            :editing="editing"
            @update:model-value="emit('update:modelValue', $event)"
        />
    </div>
</template>
