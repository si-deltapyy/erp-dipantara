<script setup lang="ts">
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
</script>
<template>
    <div class="space-y-2">
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
