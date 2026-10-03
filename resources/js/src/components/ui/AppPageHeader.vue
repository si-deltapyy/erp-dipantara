<script setup lang="ts">
defineProps<{ title: string; description?: string; breadcrumb?: string }>()
</script>

<template>
    <header class="wf-page-header">
        <div class="min-w-0">
            <p v-if="breadcrumb" class="wf-page-breadcrumb">{{ breadcrumb }}</p>
            <h1>{{ title }}</h1>
            <p v-if="description" class="wf-page-description">{{ description }}</p>
        </div>
        <div v-if="$slots.actions" class="wf-page-actions"><slot name="actions" /></div>
    </header>
</template>
