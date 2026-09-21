<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
</script>

<template>
    <section class="panel mx-auto my-12 max-w-xl text-center">
        <p class="text-5xl font-bold text-primary">404</p>
        <h1 class="mt-6 text-2xl font-bold">{{ t('notFound.title') }}</h1>
        <p class="mt-3 text-muted">{{ t('notFound.description') }}</p>
        <RouterLink :to="{ name: 'home' }" class="primary-button mt-8">{{
            t('navigation.back')
        }}</RouterLink>
    </section>
</template>
