<script setup lang="ts">
import AppBrand from '@/components/layout/AppBrand.vue'
</script>
<template>
    <main class="flex min-h-dvh items-center justify-center px-4 py-10">
        <div class="w-full max-w-lg space-y-8">
            <AppBrand />
            <div class="panel"><RouterView /></div>
        </div>
    </main>
</template>
