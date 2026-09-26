import type { Grader, GraderInput, GraderUpdate } from '@/core/types/grader'
import type { SessionUser } from '@/core/types/session'
import { ApiError } from '@/core/types/api-error'
import { parseGrader } from '@/api/grader-mapper'
import { canEditGraderEmail } from '@/core/domain/grader-policy'
import type { DemoTransaction } from './transaction'
import type { DatasetMetadata } from './schema'
import { readGraderReceipt, persistGrader } from './grader-write'

export interface GraderMutation {
    readonly id?: string
    readonly input: GraderInput | GraderUpdate
    readonly idempotencyKey: string
    readonly payloadHash: string
}
export async function writeGrader(
    transaction: DemoTransaction,
    metadata: DatasetMetadata,
    actor: SessionUser,
    mutation: GraderMutation,
): Promise<Grader> {
    const receiptId = JSON.stringify([
        actor.id,
        mutation.id ? 'PUT' : 'POST',
        '/graders/' + (mutation.id ?? ''),
        mutation.idempotencyKey,
    ])
    const replay = await readGraderReceipt(transaction, receiptId, mutation.payloadHash)
    if (replay) return replay
    const previous = mutation.id ? await transaction.get('graders', mutation.id) : undefined
    if (mutation.id && !previous) throw new ApiError('not-found')
    if (previous && (!('version' in mutation.input) || previous.version !== mutation.input.version))
        throw new ApiError('conflict')
    if (
        previous &&
        !canEditGraderEmail(previous.provisioningStatus) &&
        previous.email !== mutation.input.email
    )
        throw new ApiError('validation', { email: ['graders.emailLocked'] })
    const duplicate = (await transaction.list('graders')).some(
        (grader) =>
            grader.id !== mutation.id && grader.email.toLowerCase() === mutation.input.email,
    )
    if (duplicate) throw new ApiError('validation', { email: ['graders.emailDuplicate'] })
    const grader = makeGrader(mutation, actor.id, previous)
    return persistGrader(transaction, metadata, actor, grader, receiptId, mutation.payloadHash)
}
function makeGrader(mutation: GraderMutation, actorId: string, previous?: Grader): Grader {
    const timestamp = new Date().toISOString()
    return parseGrader({
        ...mutation.input,
        id: previous?.id ?? crypto.randomUUID(),
        version: (previous?.version ?? 0) + 1,
        createdAt: previous?.createdAt ?? timestamp,
        updatedAt: timestamp,
        createdByUserId: previous?.createdByUserId ?? actorId,
        submittedByUserId: null,
        allowedActions: [],
        userId: previous?.userId ?? null,
        provisioningStatus: previous?.provisioningStatus ?? 'not_provisioned',
    })
}
