import type { Grader, GraderProvisionInput } from '@/core/types/grader'
import type { SessionUser } from '@/core/types/session'
import type { DemoTransaction } from './transaction'
import type { DatasetMetadata } from './schema'
import { ApiError } from '@/core/types/api-error'
import { canProvisionGrader } from '@/core/domain/grader-policy'
import { parseGrader } from '@/api/grader-mapper'
import { readGraderReceipt, persistGrader } from './grader-write'

export async function provisionGrader(
    transaction: DemoTransaction,
    metadata: DatasetMetadata,
    actor: SessionUser,
    id: string,
    input: GraderProvisionInput,
    key: string,
    hash: string,
): Promise<Grader> {
    const receiptId = JSON.stringify([actor.id, 'POST', '/graders/' + id + '/provision', key])
    const replay = await readGraderReceipt(transaction, receiptId, hash)
    if (replay) return replay
    const previous = await transaction.get('graders', id)
    if (!previous) throw new ApiError('not-found')
    if (previous.version !== input.version || !canProvisionGrader(previous.provisioningStatus))
        throw new ApiError('conflict')
    const grader = parseGrader({
        ...previous,
        provisioningStatus: 'pending_activation',
        userId: null,
        version: previous.version + 1,
        updatedAt: new Date().toISOString(),
        allowedActions: [],
    })
    return persistGrader(transaction, metadata, actor, grader, receiptId, hash)
}
