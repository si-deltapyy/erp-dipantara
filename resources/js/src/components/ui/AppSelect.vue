<script setup lang="ts">
import AppFormField from './AppFormField.vue'
defineOptions({ inheritAttrs: false })
defineProps<{
    id: string
    label: string
    modelValue: string
    options: readonly { value: string; label: string }[]
    error?: string
    disabled?: boolean
}>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
function update(event: Event): void {
    if (event.target instanceof HTMLSelectElement) emit('update:modelValue', event.target.value)
}
</script>
<template>
    <AppFormField :id="id" :label="label" :error="error">
        <select
            :id="id"
            v-bind="$attrs"
            :value="modelValue"
            :disabled="disabled"
            :aria-invalid="!!error"
            :aria-describedby="error ? id + '-error' : undefined"
            class="min-h-11 w-full rounded-md border border-line bg-white px-3 py-2 focus:border-primary focus:ring-primary disabled:bg-canvas"
            @change="update"
        >
            <option v-for="option in options" :key="option.value" :value="option.value">
                {{ option.label }}
            </option>
        </select>
    </AppFormField>
</template>
