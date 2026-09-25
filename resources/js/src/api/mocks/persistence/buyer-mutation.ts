import type { Buyer, BuyerInput, BuyerUpdate } from '@/core/types/buyer'
import type { SessionUser } from '@/core/types/session'
import { ApiError } from '@/core/types/api-error'
import { parseBuyer } from '@/api/buyer-mapper'
import type { DemoTransaction } from './transaction'
import type { DatasetMetadata } from './schema'

export interface BuyerMutation {
    readonly id?: string
    readonly input: BuyerInput | BuyerUpdate
    readonly idempotencyKey: string
    readonly payloadHash: string
}
export async function writeBuyer(
    transaction: DemoTransaction,
    metadata: DatasetMetadata,
    actor: SessionUser,
    mutation: BuyerMutation,
): Promise<Buyer> {
    const receiptId = JSON.stringify([
        actor.id,
        mutation.id ? 'PUT' : 'POST',
        `/buyers/${mutation.id ?? ''}`,
        mutation.idempotencyKey,
    ])
    const receipt = await transaction.get('buyerMutations', receiptId)
    if (receipt && receipt.expiresAt > Date.now()) {
        if (receipt.payloadHash !== mutation.payloadHash) throw new ApiError('conflict')
        return parseBuyer(receipt.result)
    }
    const previous = mutation.id ? await transaction.get('buyers', mutation.id) : undefined
    if (mutation.id && !previous) throw new ApiError('not-found')
    if (previous && (!('version' in mutation.input) || previous.version !== mutation.input.version))
        throw new ApiError('conflict')
    const buyer = makeBuyer(mutation, actor.id, previous)
    await transaction.put('buyers', buyer)
    await transaction.put('metadata', { ...metadata, revision: metadata.revision + 1 })
    await transaction.put('audit', {
        id: crypto.randomUUID(),
        resource: 'buyers',
        recordId: buyer.id,
        actorId: actor.id,
        version: buyer.version,
    })
    await transaction.put('buyerMutations', {
        id: receiptId,
        payloadHash: mutation.payloadHash,
        expiresAt: Date.now() + 86_400_000,
        result: buyer,
    })
    return buyer
}
function makeBuyer(mutation: BuyerMutation, actorId: string, previous?: Buyer): Buyer {
    const timestamp = new Date().toISOString()
    return parseBuyer({
        ...mutation.input,
        id: previous?.id ?? crypto.randomUUID(),
        version: (previous?.version ?? 0) + 1,
        createdAt: previous?.createdAt ?? timestamp,
        updatedAt: timestamp,
        createdByUserId: previous?.createdByUserId ?? actorId,
        submittedByUserId: null,
        allowedActions: [],
    })
}
