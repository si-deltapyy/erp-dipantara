<script setup lang="ts">
import { useId } from 'vue'

defineProps<{ title: string; description?: string }>()
const headingId = useId()
</script>

<template>
    <section class="panel wf-panel" :aria-labelledby="headingId">
        <header class="wf-panel-heading">
            <div>
                <h2 :id="headingId">{{ title }}</h2>
                <p v-if="description">{{ description }}</p>
            </div>
            <slot name="actions" />
        </header>
        <slot />
        <footer v-if="$slots.footer" class="wf-panel-footer"><slot name="footer" /></footer>
    </section>
</template>
