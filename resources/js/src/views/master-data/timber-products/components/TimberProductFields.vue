<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { TimberProductCreateInput } from '@/core/types/timber-product'
import AppTextInput from '@/components/ui/AppTextInput.vue'
const props = defineProps<{
    modelValue: TimberProductCreateInput
    errors: Partial<Record<keyof TimberProductCreateInput, string>>
    disabled: boolean
}>()
const emit = defineEmits<{ 'update:modelValue': [value: TimberProductCreateInput] }>()
const { t, te } = useI18n()
const textFields = ['name', 'type', 'grade'] as const
const numericFields = [
    'dimensionLength',
    'dimensionWidth',
    'dimensionHeight',
    'dimensionDiameter',
    'volume',
    'price',
] as const
function update(field: keyof TimberProductCreateInput, value: string): void {
    emit('update:modelValue', { ...props.modelValue, [field]: value })
}
function fieldError(field: keyof TimberProductCreateInput): string | undefined {
    const error = props.errors[field]
    return error && te(error) ? t(error) : error
}
</script>
<template>
    <div class="grid gap-5 sm:grid-cols-2">
        <p class="text-sm text-muted sm:col-span-2">{{ t('timber-products.requiredHint') }}</p>
        <AppTextInput
            v-for="field in textFields"
            :id="`timber-product-${field}`"
            :key="field"
            :model-value="modelValue[field]"
            :label="t(`timber-products.${field}`)"
            :error="fieldError(field)"
            :disabled="disabled"
            :maxlength="255"
            required
            @update:model-value="update(field, $event)"
        />
        <AppTextInput
            v-for="field in numericFields"
            :id="`timber-product-${field}`"
            :key="field"
            :model-value="modelValue[field]"
            :label="t(`timber-products.${field}`)"
            :hint="field === 'volume' ? t('timber-products.manualVolume') : undefined"
            :error="fieldError(field)"
            :disabled="disabled"
            :required="field !== 'volume'"
            :inputmode="field === 'price' ? 'numeric' : 'decimal'"
            @update:model-value="update(field, $event)"
        />
    </div>
</template>
