<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { GraderInput } from '@/core/types/grader'
import type { GraderErrors, GraderField } from '@/core/domain/grader-validation'
import AppTextInput from '@/components/ui/AppTextInput.vue'
import AppTextarea from '@/components/ui/AppTextarea.vue'
const props = defineProps<{
    modelValue: GraderInput
    errors: GraderErrors
    disabled: boolean
    emailLocked: boolean
}>()
const emit = defineEmits<{ 'update:modelValue': [value: GraderInput] }>()
const { t, te } = useI18n()
function update(field: GraderField, value: string): void {
    emit('update:modelValue', { ...props.modelValue, [field]: value })
}
function fieldError(field: GraderField): string | undefined {
    const message = props.errors[field]
    return message
        ? te(message)
            ? t(message)
            : message === 'contract.invalid'
              ? t('graders.invalid')
              : message
        : undefined
}
</script>
<template>
    <div class="space-y-4">
        <p class="text-sm text-muted">{{ t('graders.requiredHint') }}</p>
        <AppTextInput
            id="grader-name"
            :model-value="modelValue.name"
            :label="t('graders.name')"
            :error="fieldError('name')"
            :disabled="disabled"
            :maxlength="255"
            autocomplete="name"
            aria-required="true"
            @update:model-value="update('name', $event)"
        />
        <AppTextInput
            id="grader-email"
            type="email"
            :model-value="modelValue.email"
            :label="t('graders.email')"
            :hint="emailLocked ? t('graders.emailLocked') : undefined"
            :error="fieldError('email')"
            :disabled="disabled || emailLocked"
            :maxlength="254"
            autocomplete="email"
            aria-required="true"
            @update:model-value="update('email', $event)"
        />
        <AppTextInput
            id="grader-phone"
            :model-value="modelValue.phone"
            :label="t('graders.phone')"
            :hint="t('graders.optional')"
            :error="fieldError('phone')"
            :disabled="disabled"
            :maxlength="40"
            inputmode="tel"
            autocomplete="tel"
            @update:model-value="update('phone', $event)"
        />
        <AppTextarea
            id="grader-address"
            :model-value="modelValue.address"
            :label="t('graders.address')"
            :hint="t('graders.optional')"
            :error="fieldError('address')"
            :disabled="disabled"
            :maxlength="1000"
            autocomplete="street-address"
            @update:model-value="update('address', $event)"
        />
    </div>
</template>
