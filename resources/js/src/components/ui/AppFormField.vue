<script setup lang="ts">
defineProps<{ id: string; label: string; hint?: string; error?: string }>()
</script>
<template>
    <div class="space-y-2">
        <label :for="id" class="block text-sm font-semibold">{{ label }}</label>
        <slot />
        <p v-if="hint" :id="id + '-hint'" class="text-sm text-muted">{{ hint }}</p>
        <p v-if="error" :id="id + '-error'" role="alert" class="text-sm text-red-700">
            {{ error }}
        </p>
    </div>
</template>
