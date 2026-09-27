<script setup lang="ts">
withDefaults(
    defineProps<{
        type?: 'button' | 'submit' | 'reset'
        variant?: 'primary' | 'secondary' | 'danger'
        pending?: boolean
        disabled?: boolean
    }>(),
    { type: 'button', variant: 'primary' },
)
</script>
<template>
    <button
        :type="type"
        :disabled="disabled || pending"
        :aria-busy="pending || undefined"
        class="inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
        :class="{
            'bg-primary text-white hover:bg-primary-strong': variant === 'primary',
            'border border-line bg-white text-ink hover:bg-canvas': variant === 'secondary',
            'bg-red-700 text-white hover:bg-red-800': variant === 'danger',
        }"
    >
        <span
            v-if="pending"
            aria-hidden="true"
            class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
        <slot />
    </button>
</template>
