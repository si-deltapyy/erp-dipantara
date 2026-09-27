import type { Router } from 'vue-router'
import type { SessionController } from '@/composables/session-controller'
import type { useSessionStore } from '@/stores/session'
import { canAccess } from '@/core/domain/access-policy'

export function registerSessionGuard(
    router: Router,
    controller: SessionController,
    store: ReturnType<typeof useSessionStore>,
): () => void {
    return router.beforeEach(async (to) => {
        if (!to.meta.requiresAuth && to.name !== 'login') return true
        await controller.ensure()
        if (store.status === 'error')
            return { name: 'session-error', query: { returnTo: '/app' + to.fullPath } }
        if (to.name === 'login') {
            if (store.status !== 'authenticated') return true
            return { name: canAccess(store.user, []) ? 'home' : 'forbidden' }
        }
        if (store.status !== 'authenticated')
            return { name: 'login', query: { returnTo: '/app' + to.fullPath } }
        if (
            !canAccess(store.user, to.meta.requiredPermissions ?? [], to.meta.developmentCapability)
        )
            return { name: 'forbidden' }
        return true
    })
}
