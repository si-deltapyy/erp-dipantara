import type { Grader } from '@/core/types/grader'
import type { SessionUser } from '@/core/types/session'
import type { DemoTransaction } from './transaction'
import type { DatasetMetadata } from './schema'
import { ApiError } from '@/core/types/api-error'
import { parseGrader } from '@/api/grader-mapper'

export async function readGraderReceipt(
    transaction: DemoTransaction,
    receiptId: string,
    payloadHash: string,
): Promise<Grader | undefined> {
    const receipt = await transaction.get('graderMutations', receiptId)
    if (!receipt || receipt.expiresAt <= Date.now()) return undefined
    if (receipt.payloadHash !== payloadHash) throw new ApiError('conflict')
    return parseGrader(receipt.result)
}
export async function persistGrader(
    transaction: DemoTransaction,
    metadata: DatasetMetadata,
    actor: SessionUser,
    grader: Grader,
    receiptId: string,
    payloadHash: string,
): Promise<Grader> {
    await transaction.put('graders', grader)
    await transaction.put('metadata', { ...metadata, revision: metadata.revision + 1 })
    await transaction.put('audit', {
        id: crypto.randomUUID(),
        resource: 'graders',
        recordId: grader.id,
        actorId: actor.id,
        version: grader.version,
    })
    await transaction.put('graderMutations', {
        id: receiptId,
        payloadHash,
        expiresAt: Date.now() + 86_400_000,
        result: grader,
    })
    return grader
}
