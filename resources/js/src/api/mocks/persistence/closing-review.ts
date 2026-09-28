import type { Closing } from '@/core/types/closing'
import type { ReviewAction, WorkflowRejection, WorkflowVersion } from '@/core/types/workflow'
import type { SessionUser } from '@/core/types/session'
import type { DemoTransaction } from './transaction'
import type { DatasetMetadata } from './schema'
import { ApiError } from '@/core/types/api-error'
import { assertRecordAccess } from '@/core/domain/record-policy'
import { closingEligibility } from './closing-evaluator'
export interface ClosingReviewMutation {
    readonly id: string
    readonly action: ReviewAction
    readonly input: WorkflowVersion | WorkflowRejection
    readonly key: string
    readonly hash: string
}
async function closePurchaseOrder(
    transaction: DemoTransaction,
    actor: SessionUser,
    closing: Closing,
): Promise<void> {
    const eligibility = await closingEligibility(
        transaction,
        actor,
        closing.purchaseOrderId,
        closing.id,
    )
    if (!eligibility.eligible || eligibility.version !== closing.purchaseOrderVersion)
        throw new ApiError('conflict')
    const purchaseOrder = await transaction.get('purchase-orders', closing.purchaseOrderId)
    if (!purchaseOrder) throw new ApiError('not-found')
    const version = purchaseOrder.version + 1
    await transaction.put('purchase-orders', {
        ...purchaseOrder,
        status: 'closed',
        version,
        updatedAt: new Date().toISOString(),
        allowedActions: [],
    })
    await transaction.put('audit', {
        id: crypto.randomUUID(),
        resource: 'purchase-orders',
        recordId: purchaseOrder.id,
        actorId: actor.id,
        version,
        action: 'close',
    })
}
export async function reviewClosing(
    transaction: DemoTransaction,
    metadata: DatasetMetadata,
    actor: SessionUser,
    mutation: ClosingReviewMutation,
): Promise<Closing> {
    const previous = await transaction.get('closings', mutation.id)
    if (!previous) throw new ApiError('not-found')
    assertRecordAccess(actor, `closings.${mutation.action}`, previous)
    const receiptId = JSON.stringify([actor.id, mutation.action, mutation.id, mutation.key])
    const receipt = await transaction.get('closingMutations', receiptId)
    if (receipt && receipt.expiresAt > Date.now()) {
        if (receipt.payloadHash !== mutation.hash) throw new ApiError('conflict')
        return receipt.result
    }
    if (previous.status !== 'requested' || previous.version !== mutation.input.version)
        throw new ApiError('conflict')
    if (mutation.action === 'approve') await closePurchaseOrder(transaction, actor, previous)
    const closing: Closing = {
        ...previous,
        status: mutation.action === 'approve' ? 'approved' : 'rejected',
        rejectionReason: 'reason' in mutation.input ? mutation.input.reason : null,
        version: previous.version + 1,
        updatedAt: new Date().toISOString(),
        allowedActions: [],
    }
    await transaction.put('closings', closing)
    await transaction.put('metadata', { ...metadata, revision: metadata.revision + 1 })
    await transaction.put('audit', {
        id: crypto.randomUUID(),
        resource: 'closings',
        recordId: closing.id,
        actorId: actor.id,
        version: closing.version,
        action: mutation.action,
        ...('reason' in mutation.input ? { reason: mutation.input.reason } : {}),
    })
    await transaction.put('closingMutations', {
        id: receiptId,
        payloadHash: mutation.hash,
        expiresAt: Date.now() + 86400000,
        result: closing,
    })
    return closing
}
