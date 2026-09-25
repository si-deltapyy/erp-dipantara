<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import AppState from '@/components/ui/AppState.vue'
import { defineAsyncComponent } from 'vue'
import { mockEnabled } from '@/core/constants/environment'
const SessionControls = mockEnabled
    ? defineAsyncComponent(() => import('./components/SessionControls.vue'))
    : undefined
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
        <h1 class="text-xl font-bold">{{ t('auth.bootstrapError') }}</h1>
        <AppState
            :kind="store.status === 'loading' ? 'loading' : 'error'"
            :message="t(store.status === 'loading' ? 'auth.loading' : 'auth.bootstrapError')"
            @retry="retry"
        />
        <component :is="SessionControls" v-if="SessionControls" />
    </div>
</template>
