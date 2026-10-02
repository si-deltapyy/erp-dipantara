<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import AppState from '@/components/ui/AppState.vue'
import AppPageHeader from '@/components/ui/AppPageHeader.vue'
import { useSession } from '@/composables/useSession'
import { useSessionStore } from '@/stores/session'
import { internalDestination } from '@/core/domain/access-policy'
const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const session = useSession()
const store = useSessionStore()
async function retry(): Promise<void> {
    if (store.status === 'loading') return
    await session.refresh()
    if (store.status !== 'error') await router.replace(internalDestination(route.query.returnTo))
}
</script>
<template>
    <div class="space-y-6">
        <AppPageHeader :title="t('auth.bootstrapError')" />
        <AppState
            :kind="store.status === 'loading' ? 'loading' : 'error'"
            :message="t(store.status === 'loading' ? 'auth.loading' : 'auth.bootstrapDescription')"
            @retry="retry"
        />
    </div>
</template>
