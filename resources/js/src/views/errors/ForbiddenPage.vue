<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import AppPageHeader from '@/components/ui/AppPageHeader.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import { canAccess } from '@/core/domain/access-policy'
import { useSessionStore } from '@/stores/session'
import SessionActions from '@/views/auth/components/SessionActions.vue'
const { t } = useI18n()
const store = useSessionStore()
</script>
<template>
    <div class="space-y-5">
        <span class="wf-state-icon"><AppIcon name="close" :size="28" /></span>
        <AppPageHeader :title="t('forbidden.title')" :description="t('forbidden.description')" />
        <RouterLink v-if="canAccess(store.user, [])" to="/" class="primary-button">{{
            t('navigation.back')
        }}</RouterLink>
        <SessionActions />
    </div>
</template>
