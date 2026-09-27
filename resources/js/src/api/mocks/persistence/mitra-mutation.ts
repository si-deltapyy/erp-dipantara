import type { Mitra, MitraInput, MitraUpdate } from '@/core/types/mitra'
import type { SessionUser } from '@/core/types/session'
import { ApiError } from '@/core/types/api-error'
import { parseMitra } from '@/api/mitra-mapper'
import type { DemoTransaction } from './transaction'
import type { DatasetMetadata } from './schema'

export interface MitraMutation {
    readonly id?: string
    readonly input: MitraInput | MitraUpdate
    readonly idempotencyKey: string
    readonly payloadHash: string
}
export async function writeMitra(
    transaction: DemoTransaction,
    metadata: DatasetMetadata,
    actor: SessionUser,
    mutation: MitraMutation,
): Promise<Mitra> {
    const receiptId = JSON.stringify([
        actor.id,
        mutation.id ? 'PUT' : 'POST',
        `/mitras/${mutation.id ?? ''}`,
        mutation.idempotencyKey,
    ])
    const receipt = await transaction.get('mitraMutations', receiptId)
    if (receipt && receipt.expiresAt > Date.now()) {
        if (receipt.payloadHash !== mutation.payloadHash) throw new ApiError('conflict')
        return parseMitra(receipt.result)
    }
    const previous = mutation.id ? await transaction.get('mitras', mutation.id) : undefined
    if (mutation.id && !previous) throw new ApiError('not-found')
    if (previous && (!('version' in mutation.input) || previous.version !== mutation.input.version))
        throw new ApiError('conflict')
    const mitra = makeMitra(mutation, actor.id, previous)
    await transaction.put('mitras', mitra)
    await transaction.put('metadata', { ...metadata, revision: metadata.revision + 1 })
    await transaction.put('audit', {
        id: crypto.randomUUID(),
        resource: 'mitras',
        recordId: mitra.id,
        actorId: actor.id,
        version: mitra.version,
    })
    await transaction.put('mitraMutations', {
        id: receiptId,
        payloadHash: mutation.payloadHash,
        expiresAt: Date.now() + 86_400_000,
        result: mitra,
    })
    return mitra
}
function makeMitra(mutation: MitraMutation, actorId: string, previous?: Mitra): Mitra {
    const timestamp = new Date().toISOString()
    return parseMitra({
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
