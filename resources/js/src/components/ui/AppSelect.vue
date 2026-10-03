<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import AppFormField from './AppFormField.vue'
defineOptions({ inheritAttrs: false })
defineProps<{
    id: string
    label: string
    modelValue: string
    options: readonly { value: string; label: string }[]
    error?: string
    disabled?: boolean
    renderer?: 'native' | 'nice'
}>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
const AppNiceSelect = defineAsyncComponent(() => import('./AppNiceSelect.vue'))
function update(event: Event): void {
    if (event.target instanceof HTMLSelectElement) emit('update:modelValue', event.target.value)
}
</script>
<template>
    <AppFormField
        :id="id"
        :control-id="renderer === 'nice' ? `${id}-control` : id"
        :label="label"
        :error="error"
    >
        <AppNiceSelect
            v-if="renderer === 'nice'"
            v-bind="$attrs"
            :id="id"
            :label="label"
            :model-value="modelValue"
            :options="options"
            :disabled="disabled"
            :error="error"
            @update:model-value="emit('update:modelValue', $event)"
        />
        <select
            v-else
            :id="id"
            v-bind="$attrs"
            :value="modelValue"
            :disabled="disabled"
            :aria-invalid="!!error"
            :aria-describedby="error ? id + '-error' : undefined"
            class="wf-form-select min-h-11 w-full rounded-md border border-line bg-white px-3 py-2 focus:border-primary focus:ring-primary disabled:bg-canvas"
            @change="update"
        >
            <option v-for="option in options" :key="option.value" :value="option.value">
                {{ option.label }}
            </option>
        </select>
    </AppFormField>
</template>
