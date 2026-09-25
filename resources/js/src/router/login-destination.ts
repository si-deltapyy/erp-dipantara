import type { Router } from 'vue-router'
import type { SessionUser } from '@/core/types/session'
import { canAccess, internalDestination } from '@/core/domain/access-policy'
export function loginDestination(
    router: Router,
    target: unknown,
    user: SessionUser | null,
): string {
    const destination = router.resolve(internalDestination(target))
    const allowed =
        destination.name &&
        !['login', 'session-error', 'not-found', 'forbidden'].includes(String(destination.name)) &&
        canAccess(
            user,
            destination.meta.requiredPermissions ?? [],
            destination.meta.developmentCapability,
        )
    if (allowed) return destination.fullPath
    return canAccess(user, []) ? '/' : '/forbidden'
}
