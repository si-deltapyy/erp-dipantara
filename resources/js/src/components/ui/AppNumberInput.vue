<script setup lang="ts">
import AppFormField from './AppFormField.vue'
defineOptions({ inheritAttrs: false })
defineProps<{
    id: string
    label: string
    modelValue: number | null
    error?: string
    disabled?: boolean
}>()
const emit = defineEmits<{ 'update:modelValue': [value: number | null] }>()
function update(event: Event): void {
    if (!(event.target instanceof HTMLInputElement)) return
    const value = event.target.valueAsNumber
    emit('update:modelValue', Number.isFinite(value) ? value : null)
}
</script>
<template>
    <AppFormField :id="id" :label="label" :error="error">
        <input
            :id="id"
            v-bind="$attrs"
            type="number"
            :value="modelValue"
            :disabled="disabled"
            :aria-invalid="!!error"
            :aria-describedby="error ? id + '-error' : undefined"
            class="min-h-11 w-full rounded-md border border-line px-3 py-2 focus:border-primary focus:ring-primary disabled:bg-canvas"
            @input="update"
        />
    </AppFormField>
</template>
