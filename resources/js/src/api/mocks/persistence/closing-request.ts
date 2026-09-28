import type { Closing, ClosingInput } from '@/core/types/closing'
import type { SessionUser } from '@/core/types/session'
import type { DemoTransaction } from './transaction'
import type { DatasetMetadata } from './schema'
import { parseId } from '@/api/contracts/value-parsers'
import { ApiError } from '@/core/types/api-error'
import { closingEligibility } from './closing-evaluator'
export async function requestClosing(
    transaction: DemoTransaction,
    metadata: DatasetMetadata,
    actor: SessionUser,
    input: ClosingInput,
    key: string,
    hash: string,
): Promise<Closing> {
    const receiptId = JSON.stringify([actor.id, 'request', input.purchaseOrderId, key])
    const receipt = await transaction.get('closingMutations', receiptId)
    if (receipt && receipt.expiresAt > Date.now()) {
        if (receipt.payloadHash !== hash) throw new ApiError('conflict')
        return receipt.result
    }
    const eligibility = await closingEligibility(transaction, actor, input.purchaseOrderId)
    if (
        !eligibility.eligible ||
        eligibility.snapshotToken !== input.snapshotToken ||
        eligibility.version !== input.version
    )
        throw new ApiError('conflict')
    const purchaseOrder = await transaction.get('purchase-orders', input.purchaseOrderId)
    if (!purchaseOrder) throw new ApiError('not-found')
    const now = new Date().toISOString()
    const closing: Closing = {
        id: crypto.randomUUID(),
        purchaseOrderId: purchaseOrder.id,
        purchaseOrderNumber: purchaseOrder.number,
        ownerUserId: purchaseOrder.createdByUserId,
        purchaseOrderVersion: purchaseOrder.version,
        eligibilityToken: eligibility.snapshotToken,
        notes: input.notes,
        status: 'requested',
        rejectionReason: null,
        version: 1,
        createdByUserId: parseId(actor.id),
        submittedByUserId: parseId(actor.id),
        allowedActions: [],
        createdAt: now,
        updatedAt: now,
    }
    await transaction.put('closings', closing)
    await transaction.put('metadata', { ...metadata, revision: metadata.revision + 1 })
    await transaction.put('audit', {
        id: crypto.randomUUID(),
        resource: 'closings',
        recordId: closing.id,
        actorId: actor.id,
        version: closing.version,
        action: 'request',
    })
    await transaction.put('closingMutations', {
        id: receiptId,
        payloadHash: hash,
        expiresAt: Date.now() + 86400000,
        result: closing,
    })
    return closing
}
