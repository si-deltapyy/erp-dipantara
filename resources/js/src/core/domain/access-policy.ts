import type { DevelopmentCapability, SessionUser } from '@/core/types/session'

export function canAccess(
    user: SessionUser | null,
    required: readonly string[],
    developmentCapability?: DevelopmentCapability,
): boolean {
    if (!user) return false
    if (developmentCapability && !user.developmentCapabilities.includes(developmentCapability))
        return false
    return required.every((permission) => user.permissions.includes(permission))
}
export function internalDestination(value: unknown): string {
    if (typeof value !== 'string' || !value.startsWith('/app/')) return '/'
    if (
        [...value].some(
            (character) => character.charCodeAt(0) <= 32 || character === String.fromCharCode(92),
        ) ||
        /%2f|%5c|%2e/i.test(value)
    )
        return '/'
    const url = new URL(value, 'https://woodflow.test')
    if (url.origin !== 'https://woodflow.test' || !url.pathname.startsWith('/app/')) return '/'
    return url.pathname.slice(4) + url.search + url.hash
}
