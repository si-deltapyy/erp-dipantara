import { watch } from 'vue'
import type { App } from 'vue'
import type { Pinia } from 'pinia'
import type { Router } from 'vue-router'
import type { SessionApi } from '@/core/types/session'
import { createSessionApi } from '@/api/session-api'
import { useSessionStore } from '@/stores/session'
import { SessionController } from './session-controller'
import { sessionKey } from './useSession'
import { registerSessionGuard } from '@/router/guards/session-guard'
import { canAccess } from '@/core/domain/access-policy'

export function configureSession(
    app: App,
    pinia: Pinia,
    router: Router,
    adapter: SessionApi,
): void {
    const store = useSessionStore(pinia)
    const session = new SessionController(createSessionApi(adapter), store)
    app.provide(sessionKey, session)
    const removeGuard = registerSessionGuard(router, session, store)
    const stop = watchSessionRoute(router, store)
    const cleanup = (): void => {
        stop()
        removeGuard()
        session.cancel()
    }
    app.onUnmount(cleanup)
    if (import.meta.hot) import.meta.hot.dispose(cleanup)
}

function watchSessionRoute(router: Router, store: ReturnType<typeof useSessionStore>): () => void {
    return watch(
        () => [store.status, store.user],
        () => {
            const route = router.currentRoute.value
            if (!route.meta.requiresAuth || store.status === 'loading') return
            if (store.status === 'guest')
                void router.replace({
                    name: 'login',
                    query: { expired: '1', returnTo: '/app' + route.fullPath },
                })
            else if (store.status === 'error')
                void router.replace({
                    name: 'session-error',
                    query: { returnTo: '/app' + route.fullPath },
                })
            else if (
                !canAccess(
                    store.user,
                    route.meta.requiredPermissions ?? [],
                    route.meta.developmentCapability,
                )
            )
                void router.replace({ name: 'forbidden' })
        },
    )
}
