<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { TimberProductInput } from '@/core/types/timber-product'
import type {
    TimberProductErrors,
    TimberProductField,
} from '@/core/domain/timber-product-validation'
import AppTextInput from '@/components/ui/AppTextInput.vue'
import TimberDimensions from './TimberDimensions.vue'
import TimberPrices from './TimberPrices.vue'
const props = defineProps<{
    modelValue: TimberProductInput
    errors: TimberProductErrors
    disabled: boolean
    volume: string | null
    simulation: boolean
}>()
const emit = defineEmits<{ 'update:modelValue': [value: TimberProductInput] }>()
const { t, te } = useI18n()
function update(field: TimberProductField, value: string): void {
    emit('update:modelValue', { ...props.modelValue, [field]: value })
}
function fieldError(field: TimberProductField): string | undefined {
    const message = props.errors[field]
    if (!message) return undefined
    if (te(message)) return t(message)
    return message === 'contract.invalid' ? t('timber-products.invalid') : message
}
</script>
<template>
    <div class="space-y-5">
        <p class="text-sm text-muted">{{ t('timber-products.requiredHint') }}</p>
        <AppTextInput
            v-for="field in ['name', 'gradeCode'] as const"
            :id="`timber-product-${field}`"
            :key="field"
            :model-value="modelValue[field]"
            :label="t(`timber-products.${field}`)"
            :error="fieldError(field)"
            :disabled="disabled"
            :maxlength="255"
            aria-required="true"
            @update:model-value="update(field, $event)"
        />
        <TimberDimensions
            :specification="modelValue"
            :disabled="disabled"
            :field-error="fieldError"
            :volume="volume"
            :simulation="simulation"
            @update="update"
        />
        <TimberPrices
            :prices="modelValue"
            :disabled="disabled"
            :field-error="fieldError"
            @update="update"
        />
    </div>
</template>
