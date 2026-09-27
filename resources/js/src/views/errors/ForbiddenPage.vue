<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { canAccess } from '@/core/domain/access-policy'
import { useSessionStore } from '@/stores/session'
import SessionActions from '@/views/auth/components/SessionActions.vue'
const { t } = useI18n()
const store = useSessionStore()
</script>
<template>
    <div class="space-y-5">
        <h1 class="text-2xl font-bold">{{ t('forbidden.title') }}</h1>
        <p class="text-muted">{{ t('forbidden.description') }}</p>
        <RouterLink v-if="canAccess(store.user, [])" to="/" class="primary-button">{{
            t('navigation.back')
        }}</RouterLink>
        <SessionActions />
    </div>
</template>
