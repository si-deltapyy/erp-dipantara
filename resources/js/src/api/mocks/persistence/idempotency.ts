import { ApiError } from '@/core/types/api-error'
import type { DemoTransaction } from './transaction'
import type { DemoSample } from './schema'

export interface MutationIdentity {
    readonly actorId: string
    readonly method: 'PUT' | 'POST'
    readonly path: string
    readonly key: string
    readonly payloadHash: string
}
export async function hashMutationPayload(
    payload: Readonly<Record<string, string | number>>,
): Promise<string> {
    const canonical = JSON.stringify(
        Object.fromEntries(
            Object.entries(payload).sort(([left], [right]) => left.localeCompare(right)),
        ),
    )
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical))
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}
export async function executeIdempotentMutation(
    transaction: DemoTransaction,
    identity: MutationIdentity,
    mutate: () => Promise<DemoSample>,
): Promise<DemoSample> {
    if (!identity.key.trim())
        throw new ApiError('validation', { idempotencyKey: ['contract.invalid'] })
    const id = JSON.stringify([identity.actorId, identity.method, identity.path, identity.key])
    const receipt = await transaction.get('mutations', id)
    if (receipt && receipt.expiresAt > Date.now()) {
        if (receipt.payloadHash !== identity.payloadHash) throw new ApiError('conflict')
        return receipt.result
    }
    const result = await mutate()
    await transaction.put('mutations', {
        id,
        payloadHash: identity.payloadHash,
        expiresAt: Date.now() + 86_400_000,
        result,
    })
    return result
}
