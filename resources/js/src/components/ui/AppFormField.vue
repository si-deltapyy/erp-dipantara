<script setup lang="ts">
import { inject } from 'vue'
import { formValidationKey } from '@/core/types/form-validation'
const validateField = inject(formValidationKey, undefined)
const props = defineProps<{
    id: string
    controlId?: string
    label: string
    hint?: string
    error?: string
}>()
function focusControl(): void {
    if (props.controlId) document.getElementById(props.controlId)?.focus()
}
function validateBlur(event: FocusEvent): void {
    const control = event.target
    if (!(control instanceof HTMLElement)) return
    const field = control.getAttribute('name') ?? control.dataset.validationField
    if (field) validateField?.(field)
}
</script>
<template>
    <div class="space-y-2" @focusout="validateBlur">
        <label :for="controlId ?? id" class="block text-sm font-semibold" @click="focusControl">{{
            label
        }}</label>
        <slot />
        <p v-if="hint" :id="id + '-hint'" class="text-sm text-muted">{{ hint }}</p>
        <p v-if="error" :id="id + '-error'" role="alert" class="text-sm text-danger">
            {{ error }}
        </p>
    </div>
</template>
