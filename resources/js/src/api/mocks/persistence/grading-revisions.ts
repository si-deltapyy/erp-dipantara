import type { Grading, GradingRevisionInput, GradingRow } from '@/core/types/grading'
import type { Assignment } from '@/core/types/assignment'
import type { SessionUser } from '@/core/types/session'
import type { DemoTransaction } from './transaction'
import type { GradingDownstream } from '../grading-downstream'
import { assertUnallocatedChanges, changedGradingRows } from '../grading-downstream'
import { ApiError } from '@/core/types/api-error'
import { parseId } from '@/api/contracts/value-parsers'
import { assertGradingCapacity, calculateGrading, labelGrading } from './grading-context'
async function lineageIds(
    transaction: DemoTransaction,
    parent: Grading,
): Promise<readonly string[]> {
    const ids = new Set<string>()
    let current: Grading | undefined = parent
    while (current) {
        if (ids.has(current.id)) throw new ApiError('conflict')
        ids.add(current.id)
        current = current.revisionOfId
            ? await transaction.get('gradings', current.revisionOfId)
            : undefined
    }
    return [...ids]
}
export async function assertRevisionParent(
    transaction: DemoTransaction,
    revision: Grading,
    rows: readonly GradingRow[],
    downstream: GradingDownstream,
): Promise<Grading | undefined> {
    if (!revision.revisionOfId) return undefined
    const parent = await transaction.get('gradings', revision.revisionOfId)
    if (!parent || parent.status !== 'approved' || parent.assignmentId !== revision.assignmentId)
        throw new ApiError('conflict')
    assertUnallocatedChanges(parent, rows, await lineageIds(transaction, parent), downstream)
    return parent
}
export async function createGradingRevision(
    transaction: DemoTransaction,
    parent: Grading,
    assignment: Assignment,
    actor: SessionUser,
    input: GradingRevisionInput,
    downstream: GradingDownstream,
): Promise<Grading> {
    if (parent.status !== 'approved' || assignment.orderStatus !== 'approved')
        throw new ApiError('conflict')
    const grader = await transaction.get('graders', assignment.graderId)
    if (!grader || grader.provisioningStatus !== 'active') throw new ApiError('conflict')
    if (
        (await transaction.list('gradings')).some(
            (grading) =>
                grading.revisionOfId === parent.id &&
                ['draft', 'submitted', 'rejected'].includes(grading.status),
        )
    )
        throw new ApiError('conflict', { rows: ['gradings.pendingRevision'] })
    assertUnallocatedChanges(parent, input.rows, await lineageIds(transaction, parent), downstream)
    const nextInput = {
        assignmentId: parent.assignmentId,
        gradingDate: input.gradingDate,
        rows: input.rows,
    }
    await assertGradingCapacity(transaction, nextInput, assignment, [parent.id])
    const now = new Date().toISOString()
    return labelGrading(
        {
            ...parent,
            ...nextInput,
            ...calculateGrading(nextInput, assignment),
            id: crypto.randomUUID(),
            version: 1,
            status: 'draft',
            revisionOfId: parent.id,
            revisionReason: input.reason,
            rejectionReason: null,
            createdByUserId: parseId(actor.id),
            submittedByUserId: null,
            createdAt: now,
            updatedAt: now,
            allowedActions: [],
        },
        assignment,
    )
}
export async function activateGradingRevision(
    transaction: DemoTransaction,
    revision: Grading,
    assignment: Assignment,
    actor: SessionUser,
    downstream: GradingDownstream,
): Promise<Grading> {
    if (revision.status !== 'approved' || !revision.revisionOfId) return revision
    const parent = await assertRevisionParent(transaction, revision, revision.rows, downstream)
    if (!parent) throw new ApiError('conflict')
    const order = await transaction.get('orders', assignment.orderId)
    if (!order || order.status !== 'approved') throw new ApiError('conflict')
    await transaction.put('gradings', {
        ...parent,
        status: 'superseded',
        version: parent.version + 1,
        updatedAt: revision.updatedAt,
        allowedActions: [],
    })
    await transaction.put('audit', {
        id: crypto.randomUUID(),
        resource: 'gradings',
        recordId: parent.id,
        actorId: actor.id,
        version: parent.version + 1,
        action: 'supersede',
        reason: revision.revisionReason ?? undefined,
    })
    return {
        ...revision,
        invoiceRevisionRequired:
            parent.invoiceRevisionRequired ||
            (changedGradingRows(parent, revision) &&
                downstream.hasIssuedInvoice(order.purchaseOrderId, assignment.mitraId)),
    }
}
