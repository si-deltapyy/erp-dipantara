<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { GraderContactInput } from '@/core/types/grader'
import AppTextInput from '@/components/ui/AppTextInput.vue'
const props = defineProps<{
    modelValue: GraderContactInput
    errors: Partial<Record<keyof GraderContactInput, string>>
    disabled: boolean
}>()
const emit = defineEmits<{ 'update:modelValue': [value: GraderContactInput] }>()
const { t, te } = useI18n()
function update(field: keyof GraderContactInput, value: string): void {
    emit('update:modelValue', { ...props.modelValue, [field]: value })
}
function fieldError(field: keyof GraderContactInput): string | undefined {
    const error = props.errors[field]
    return error && te(error) ? t(error) : error
}
</script>
<template>
    <div class="grid gap-5 sm:grid-cols-2">
        <AppTextInput
            id="grader-phone"
            :model-value="modelValue.phone"
            :label="t('graders.phone')"
            :error="fieldError('phone')"
            :disabled="disabled"
            :maxlength="40"
            inputmode="tel"
            :hint="t('ui.validation.phoneHint')"
            required
            :name="'phone'"
            @update:model-value="update('phone', $event)"
        />
        <AppTextInput
            id="grader-group"
            :model-value="modelValue.graderGroup"
            :label="t('graders.graderGroup')"
            :error="fieldError('graderGroup')"
            :disabled="disabled"
            :maxlength="255"
            required
            :name="'graderGroup'"
            @update:model-value="update('graderGroup', $event)"
        />
    </div>
</template>
