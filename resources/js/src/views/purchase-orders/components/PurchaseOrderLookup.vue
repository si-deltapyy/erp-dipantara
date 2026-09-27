<script setup lang="ts">
import MasterLookup from '@/views/master-data/components/MasterLookup.vue'
defineProps<{
    id: string
    kind: 'buyer' | 'timber'
    label: string
    modelValue: string
    selectedLabel?: string
    error?: string
    disabled?: boolean
}>()
const emit = defineEmits<{ 'update:modelValue': [value: string]; selected: [label: string] }>()
</script>
<template>
    <MasterLookup
        v-bind="$props"
        @update:model-value="emit('update:modelValue', $event)"
        @selected="emit('selected', $event)"
    />
</template>
