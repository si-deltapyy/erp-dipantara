import type { SessionSnapshot } from '@/core/types/session'
import { ApiError } from '@/core/types/api-error'
import {
    backendPermissionCapabilities,
    backendWorkflowCapabilities,
} from '@/core/constants/business-permissions'

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
}
function isStringList(value: unknown): value is string[] {
    return Array.isArray(value) && value.every((entry) => typeof entry === 'string')
}
function resolveCapabilities(permissions: readonly string[]): string[] {
    const direct = permissions.flatMap((permission) => [
        permission,
        ...(Object.prototype.hasOwnProperty.call(backendPermissionCapabilities, permission)
            ? backendPermissionCapabilities[permission]
            : []),
    ])
    const workflows = backendWorkflowCapabilities.flatMap(({ required, capabilities }) =>
        required.every((permission) => permissions.includes(permission)) ? capabilities : [],
    )
    return [...new Set([...direct, ...workflows])]
}
export function parseSession(response: unknown): SessionSnapshot {
    if (!isRecord(response)) throw new ApiError('unexpected')
    const user = response.user
    if (user === null) return null
    if (
        !isRecord(user) ||
        typeof user.id !== 'string' ||
        !user.id ||
        typeof user.displayName !== 'string' ||
        !isStringList(user.roles) ||
        !isStringList(user.permissions)
    )
        throw new ApiError('unexpected')
    return {
        id: user.id,
        displayName: user.displayName,
        roles: [...user.roles],
        permissions: resolveCapabilities(user.permissions),
        developmentCapabilities: [],
    }
}
