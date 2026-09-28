import { assertOpenPurchaseOrder, orderPurchaseOrderId } from './closed-order-guard'
import type { Assignment } from '@/core/types/assignment'
import type { GradingDownstream } from '../grading-downstream'
import {
    createGradingRevision,
    assertRevisionParent,
    activateGradingRevision,
} from './grading-revisions'
import type { Grading, GradingInput, GradingRevisionInput } from '@/core/types/grading'
import type { WorkflowVersion, WorkflowRejection } from '@/core/types/workflow'
import type { SessionUser } from '@/core/types/session'
import type { DemoTransaction } from './transaction'
import type { DatasetMetadata } from './schema'
import { ApiError } from '@/core/types/api-error'
import { assertRecordAccess } from '@/core/domain/record-policy'
import { parseId } from '@/api/contracts/value-parsers'
import { gradingAccess } from '../grading-policy'
import {
    gradingAssignment,
    assertGradingCapacity,
    calculateGrading,
    labelGrading,
} from './grading-context'
export interface GradingMutation {
    readonly action: 'create' | 'update' | 'submit' | 'approve' | 'reject' | 'revise'
    readonly id?: string
    readonly input:
        | (GradingInput & { version?: number })
        | WorkflowVersion
        | WorkflowRejection
        | GradingRevisionInput
    readonly key: string
    readonly hash: string
}
export async function writeGrading(
    transaction: DemoTransaction,
    metadata: DatasetMetadata,
    actor: SessionUser,
    mutation: GradingMutation,
    downstream: GradingDownstream,
): Promise<Grading> {
    const previous = mutation.id ? await transaction.get('gradings', mutation.id) : undefined
    if (mutation.id && !previous) throw new ApiError('not-found')
    const assignmentId =
        previous?.assignmentId ??
        ('assignmentId' in mutation.input ? mutation.input.assignmentId : '')
    const assignment = await gradingAssignment(transaction, assignmentId)
    assertRecordAccess(
        actor,
        `gradings.${mutation.action}`,
        previous ? gradingAccess(previous, assignment) : assignment,
    )
    await assertOpenPurchaseOrder(
        transaction,
        await orderPurchaseOrderId(transaction, assignment.orderId),
    )
    const receiptId = JSON.stringify([actor.id, mutation.action, mutation.id ?? '', mutation.key])
    const receipt = await transaction.get('gradingMutations', receiptId)
    if (receipt && receipt.expiresAt > Date.now()) {
        if (receipt.payloadHash !== mutation.hash) throw new ApiError('conflict')
        return labelGrading(receipt.result, assignment)
    }
    if (previous && (!('version' in mutation.input) || previous.version !== mutation.input.version))
        throw new ApiError('conflict')
    let changed: Grading
    if (mutation.action === 'revise') {
        if (
            !previous ||
            !('rows' in mutation.input) ||
            !('reason' in mutation.input) ||
            !('version' in mutation.input)
        )
            throw new ApiError('validation')
        changed = await createGradingRevision(
            transaction,
            previous,
            assignment,
            actor,
            mutation.input,
            downstream,
        )
    } else {
        changed = await changeGrading(
            transaction,
            actor,
            mutation,
            assignment,
            downstream,
            previous,
        )
    }
    const grading =
        mutation.action === 'approve'
            ? await activateGradingRevision(transaction, changed, assignment, actor, downstream)
            : changed
    await transaction.put('gradings', grading)
    await transaction.put('metadata', { ...metadata, revision: metadata.revision + 1 })
    await transaction.put('audit', {
        id: crypto.randomUUID(),
        resource: 'gradings',
        recordId: grading.id,
        actorId: actor.id,
        version: grading.version,
        action: mutation.action,
        ...('reason' in mutation.input ? { reason: mutation.input.reason } : {}),
    })
    await transaction.put('gradingMutations', {
        id: receiptId,
        payloadHash: mutation.hash,
        expiresAt: Date.now() + 86400000,
        result: grading,
    })
    return grading
}

async function changeGrading(
    transaction: DemoTransaction,
    actor: SessionUser,
    mutation: GradingMutation,
    assignment: Assignment,
    downstream: GradingDownstream,
    previous?: Grading,
): Promise<Grading> {
    const reviewing = mutation.action === 'approve' || mutation.action === 'reject'
    if (
        previous &&
        (reviewing
            ? previous.status !== 'submitted'
            : !['draft', 'rejected'].includes(previous.status))
    )
        throw new ApiError('conflict')
    const input = 'assignmentId' in mutation.input ? mutation.input : previous
    if (!input || input.assignmentId !== assignment.id)
        throw new ApiError('validation', { assignmentId: ['gradings.parentLocked'] })
    const grader = await transaction.get('graders', assignment.graderId)
    if (!grader || grader.provisioningStatus !== 'active') throw new ApiError('conflict')
    const parent = previous
        ? await assertRevisionParent(transaction, previous, input.rows, downstream)
        : undefined
    await assertGradingCapacity(
        transaction,
        input,
        assignment,
        [previous?.id, parent?.id].filter((id): id is string => !!id),
    )
    const submitting = mutation.action === 'submit'
    if ((submitting || reviewing) && assignment.orderStatus !== 'approved')
        throw new ApiError('conflict')
    const now = new Date().toISOString()
    return labelGrading(
        {
            assignmentId: input.assignmentId,
            gradingDate: input.gradingDate,
            rows: input.rows,
            id: previous?.id ?? crypto.randomUUID(),
            version: (previous?.version ?? 0) + 1,
            status: reviewing
                ? mutation.action === 'approve'
                    ? 'approved'
                    : 'rejected'
                : submitting
                  ? 'submitted'
                  : (previous?.status ?? 'draft'),
            ...calculateGrading(input, assignment),
            createdByUserId: previous?.createdByUserId ?? parseId(actor.id),
            submittedByUserId: submitting
                ? parseId(actor.id)
                : (previous?.submittedByUserId ?? null),
            createdAt: previous?.createdAt ?? now,
            updatedAt: now,
            allowedActions: [],
            rejectionReason:
                'reason' in mutation.input
                    ? mutation.input.reason
                    : submitting || mutation.action === 'approve'
                      ? null
                      : (previous?.rejectionReason ?? null),
            revisionOfId: previous?.revisionOfId ?? null,
            revisionReason: previous?.revisionReason ?? null,
            invoiceRevisionRequired: previous?.invoiceRevisionRequired ?? false,
            purchaseOrderNumber: '',
            mitraName: '',
            graderName: '',
        },
        assignment,
    )
}
