import { simulateTimberVolume } from '../timber-volume'
import type {
    TimberProduct,
    TimberProductInput,
    TimberProductUpdate,
} from '@/core/types/timber-product'
import type { SessionUser } from '@/core/types/session'
import { ApiError } from '@/core/types/api-error'
import { parseTimberProduct } from '@/api/timber-product-mapper'
import type { DemoTransaction } from './transaction'
import type { DatasetMetadata } from './schema'

export interface TimberProductMutation {
    readonly id?: string
    readonly input: TimberProductInput | TimberProductUpdate
    readonly idempotencyKey: string
    readonly payloadHash: string
}
export async function writeTimberProduct(
    transaction: DemoTransaction,
    metadata: DatasetMetadata,
    actor: SessionUser,
    mutation: TimberProductMutation,
): Promise<TimberProduct> {
    const receiptId = JSON.stringify([
        actor.id,
        mutation.id ? 'PUT' : 'POST',
        `/timber-products/${mutation.id ?? ''}`,
        mutation.idempotencyKey,
    ])
    const receipt = await transaction.get('timberProductMutations', receiptId)
    if (receipt && receipt.expiresAt > Date.now()) {
        if (receipt.payloadHash !== mutation.payloadHash) throw new ApiError('conflict')
        return parseTimberProduct(receipt.result)
    }
    const previous = mutation.id ? await transaction.get('timber-products', mutation.id) : undefined
    if (mutation.id && !previous) throw new ApiError('not-found')
    if (previous && (!('version' in mutation.input) || previous.version !== mutation.input.version))
        throw new ApiError('conflict')
    const timberProduct = makeTimberProduct(mutation, actor.id, previous)
    await transaction.put('timber-products', timberProduct)
    await transaction.put('metadata', { ...metadata, revision: metadata.revision + 1 })
    await transaction.put('audit', {
        id: crypto.randomUUID(),
        resource: 'timber-products',
        recordId: timberProduct.id,
        actorId: actor.id,
        version: timberProduct.version,
    })
    await transaction.put('timberProductMutations', {
        id: receiptId,
        payloadHash: mutation.payloadHash,
        expiresAt: Date.now() + 86_400_000,
        result: timberProduct,
    })
    return timberProduct
}
function makeTimberProduct(
    mutation: TimberProductMutation,
    actorId: string,
    previous?: TimberProduct,
): TimberProduct {
    const timestamp = new Date().toISOString()
    return parseTimberProduct({
        ...mutation.input,
        volumeM3: simulateTimberVolume(mutation.input.diameterCm, mutation.input.lengthM),
        id: previous?.id ?? crypto.randomUUID(),
        version: (previous?.version ?? 0) + 1,
        createdAt: previous?.createdAt ?? timestamp,
        updatedAt: timestamp,
        createdByUserId: previous?.createdByUserId ?? actorId,
        submittedByUserId: null,
        allowedActions: [],
    })
}
