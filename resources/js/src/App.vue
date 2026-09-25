<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AppLayout from '@/layouts/AppLayout.vue'
import AuthLayout from '@/layouts/AuthLayout.vue'
import AppState from '@/components/ui/AppState.vue'
import { useSessionStore } from '@/stores/session'
const session = useSessionStore()
const route = useRoute()
const { t } = useI18n()
</script>
<template>
    <main v-if="!route.name || session.status === 'loading'" class="mx-auto max-w-lg p-8">
        <AppState kind="loading" :message="t('auth.loading')" />
    </main>
    <AuthLayout v-else-if="route.meta.layout === 'auth'" />
    <AppLayout v-else />
</template>
