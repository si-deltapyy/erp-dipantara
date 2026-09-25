<script setup lang="ts">
import AppFormField from './AppFormField.vue'
defineOptions({ inheritAttrs: false })
withDefaults(
    defineProps<{
        id: string
        label: string
        modelValue: string
        type?: 'text' | 'email' | 'password'
        hint?: string
        error?: string
        disabled?: boolean
    }>(),
    { type: 'text', hint: undefined, error: undefined },
)
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
function update(event: Event): void {
    if (event.target instanceof HTMLInputElement) emit('update:modelValue', event.target.value)
}
</script>
<template>
    <AppFormField :id="id" :label="label" :hint="hint" :error="error">
        <input
            :id="id"
            v-bind="$attrs"
            :type="type"
            :value="modelValue"
            :disabled="disabled"
            :aria-invalid="!!error"
            :aria-describedby="
                [hint ? id + '-hint' : '', error ? id + '-error' : ''].filter(Boolean).join(' ') ||
                undefined
            "
            class="min-h-11 w-full rounded-md border border-line bg-white px-3 py-2 text-ink focus:border-primary focus:ring-primary disabled:bg-canvas"
            @input="update"
        />
    </AppFormField>
</template>
