<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { MitraInput } from '@/core/types/mitra'
import type { MitraErrors, MitraField } from '@/core/domain/mitra-validation'
import AppTextInput from '@/components/ui/AppTextInput.vue'
import AppTextarea from '@/components/ui/AppTextarea.vue'
const props = defineProps<{ modelValue: MitraInput; errors: MitraErrors; disabled: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: MitraInput] }>()
const { t, te } = useI18n()
function update(field: MitraField, value: string): void {
    emit('update:modelValue', { ...props.modelValue, [field]: value })
}
function fieldError(field: MitraField): string | undefined {
    const message = props.errors[field]
    return message
        ? te(message)
            ? t(message)
            : message === 'contract.invalid'
              ? t('mitras.invalid')
              : message
        : undefined
}
</script>
<template>
    <div class="space-y-4">
        <p class="text-sm text-muted">{{ t('mitras.requiredHint') }}</p>
        <AppTextInput
            id="mitra-name"
            :model-value="modelValue.name"
            :label="t('mitras.name')"
            :error="fieldError('name')"
            :disabled="disabled"
            :maxlength="255"
            autocomplete="name"
            aria-required="true"
            @update:model-value="update('name', $event)"
        />
        <AppTextInput
            id="mitra-phone"
            :model-value="modelValue.phone"
            :label="t('mitras.phone')"
            :hint="t('mitras.optional')"
            :error="fieldError('phone')"
            :disabled="disabled"
            :maxlength="40"
            inputmode="tel"
            autocomplete="tel"
            @update:model-value="update('phone', $event)"
        />
        <AppTextarea
            id="mitra-address"
            :model-value="modelValue.address"
            :label="t('mitras.address')"
            :hint="t('mitras.optional')"
            :error="fieldError('address')"
            :disabled="disabled"
            :maxlength="1000"
            autocomplete="street-address"
            @update:model-value="update('address', $event)"
        />
    </div>
</template>
