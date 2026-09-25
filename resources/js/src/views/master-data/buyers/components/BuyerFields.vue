<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { BuyerInput } from '@/core/types/buyer'
import type { BuyerErrors, BuyerField } from '@/core/domain/buyer-validation'
import AppTextInput from '@/components/ui/AppTextInput.vue'
import AppTextarea from '@/components/ui/AppTextarea.vue'
const props = defineProps<{ modelValue: BuyerInput; errors: BuyerErrors; disabled: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: BuyerInput] }>()
const { t, te } = useI18n()
function update(field: BuyerField, value: string): void {
    emit('update:modelValue', { ...props.modelValue, [field]: value })
}
function fieldError(field: BuyerField): string | undefined {
    const message = props.errors[field]
    return message
        ? te(message)
            ? t(message)
            : message === 'contract.invalid'
              ? t('buyers.invalid')
              : message
        : undefined
}
</script>
<template>
    <div class="space-y-4">
        <p class="text-sm text-muted">{{ t('buyers.requiredHint') }}</p>
        <AppTextInput
            id="buyer-company"
            :model-value="modelValue.companyName"
            :label="t('buyers.companyName')"
            :error="fieldError('companyName')"
            :disabled="disabled"
            :maxlength="255"
            autocomplete="organization"
            aria-required="true"
            @update:model-value="update('companyName', $event)"
        />
        <AppTextInput
            id="buyer-contact"
            :model-value="modelValue.contactName"
            :label="t('buyers.contactName')"
            :error="fieldError('contactName')"
            :disabled="disabled"
            :maxlength="255"
            autocomplete="name"
            aria-required="true"
            @update:model-value="update('contactName', $event)"
        />
        <AppTextInput
            id="buyer-phone"
            :model-value="modelValue.phone"
            :label="t('buyers.phone')"
            :hint="t('buyers.optional')"
            :error="fieldError('phone')"
            :disabled="disabled"
            :maxlength="40"
            inputmode="tel"
            autocomplete="tel"
            @update:model-value="update('phone', $event)"
        />
        <AppTextarea
            id="buyer-address"
            :model-value="modelValue.address"
            :label="t('buyers.address')"
            :hint="t('buyers.optional')"
            :error="fieldError('address')"
            :disabled="disabled"
            :maxlength="1000"
            autocomplete="street-address"
            @update:model-value="update('address', $event)"
        />
    </div>
</template>
