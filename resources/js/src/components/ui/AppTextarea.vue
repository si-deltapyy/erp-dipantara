<script setup lang="ts">
import AppFormField from './AppFormField.vue'
defineOptions({ inheritAttrs: false })
defineProps<{
    id: string
    label: string
    modelValue: string
    hint?: string
    error?: string
    disabled?: boolean
}>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
function update(event: Event): void {
    if (event.target instanceof HTMLTextAreaElement) emit('update:modelValue', event.target.value)
}
</script>
<template>
    <AppFormField :id="id" :label="label" :hint="hint" :error="error">
        <textarea
            :id="id"
            v-bind="$attrs"
            :value="modelValue"
            :disabled="disabled"
            :aria-invalid="!!error"
            :aria-describedby="
                [hint ? id + '-hint' : '', error ? id + '-error' : ''].filter(Boolean).join(' ') ||
                undefined
            "
            rows="3"
            class="w-full rounded-md border border-line bg-white px-3 py-2 text-ink focus:border-primary focus:ring-primary disabled:bg-canvas"
            @input="update"
        />
    </AppFormField>
</template>
