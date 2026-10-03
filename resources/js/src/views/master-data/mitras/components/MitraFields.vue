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
    <div class="grid gap-5 sm:grid-cols-2">
        <p class="text-sm text-muted sm:col-span-2">{{ t('mitras.requiredHint') }}</p>
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
            aria-required="true"
            :error="fieldError('phone')"
            :disabled="disabled"
            :maxlength="40"
            inputmode="tel"
            autocomplete="tel"
            @update:model-value="update('phone', $event)"
        />
        <AppTextInput
            id="mitra-grader-group"
            aria-required="true"
            :model-value="modelValue.graderGroup"
            :label="t('mitras.graderGroup')"
            :error="fieldError('graderGroup')"
            :disabled="disabled"
            :maxlength="255"
            @update:model-value="update('graderGroup', $event)"
        />
        <AppTextarea
            id="mitra-address"
            class="sm:col-span-2"
            :model-value="modelValue.address"
            :label="t('mitras.address')"
            aria-required="true"
            :error="fieldError('address')"
            :disabled="disabled"
            :maxlength="255"
            autocomplete="street-address"
            @update:model-value="update('address', $event)"
        />
    </div>
</template>
