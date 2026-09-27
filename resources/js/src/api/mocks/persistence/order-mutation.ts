import type { Order, OrderInput } from '@/core/types/order'
import type { WorkflowVersion, WorkflowRejection } from '@/core/types/workflow'
import type { SessionUser } from '@/core/types/session'
import { ApiError } from '@/core/types/api-error'
import { assertRecordAccess } from '@/core/domain/record-policy'
import type { DemoTransaction } from './transaction'
import type { DatasetMetadata } from './schema'
import { resolveOrderLabels } from './order-labels'
import { assertOrderReady } from './order-readiness'
import { parseId } from '@/api/contracts/value-parsers'
export interface OrderMutation {
    readonly action: 'create' | 'update' | 'submit' | 'approve' | 'reject'
    readonly id?: string
    readonly input:
        (OrderInput & { readonly version?: number }) | WorkflowVersion | WorkflowRejection
    readonly key: string
    readonly hash: string
}
export async function writeOrder(
    transaction: DemoTransaction,
    metadata: DatasetMetadata,
    actor: SessionUser,
    mutation: OrderMutation,
): Promise<Order> {
    const previous = mutation.id ? await transaction.get('orders', mutation.id) : undefined
    if (mutation.id && !previous) throw new ApiError('not-found')
    if (previous) assertRecordAccess(actor, `orders.${mutation.action}`, previous)
    const receiptId = JSON.stringify([actor.id, mutation.action, mutation.id ?? '', mutation.key])
    const receipt = await transaction.get('orderMutations', receiptId)
    if (receipt && receipt.expiresAt > Date.now()) {
        if (receipt.payloadHash !== mutation.hash) throw new ApiError('conflict')
        return resolveOrderLabels(transaction, receipt.result)
    }
    if (previous && (!('version' in mutation.input) || previous.version !== mutation.input.version))
        throw new ApiError('conflict')
    const order = await resolveOrderLabels(
        transaction,
        mutation.action === 'create' || mutation.action === 'update'
            ? await draftOrder(transaction, actor, mutation, previous)
            : await transitionOrder(transaction, actor, mutation, previous),
    )
    await transaction.put('orders', order)
    await transaction.put('metadata', { ...metadata, revision: metadata.revision + 1 })
    await transaction.put('audit', {
        id: crypto.randomUUID(),
        resource: 'orders',
        recordId: order.id,
        actorId: actor.id,
        version: order.version,
        action: mutation.action,
        ...('reason' in mutation.input ? { reason: mutation.input.reason } : {}),
    })
    await transaction.put('orderMutations', {
        id: receiptId,
        payloadHash: mutation.hash,
        expiresAt: Date.now() + 86400000,
        result: order,
    })
    return order
}
async function draftOrder(
    transaction: DemoTransaction,
    actor: SessionUser,
    mutation: OrderMutation,
    previous?: Order,
): Promise<Order> {
    if (!('purchaseOrderId' in mutation.input)) throw new ApiError('validation')
    if (previous && !['draft', 'rejected'].includes(previous.status)) throw new ApiError('conflict')
    const po = await transaction.get('purchase-orders', mutation.input.purchaseOrderId)
    if (!po) throw new ApiError('validation', { purchaseOrderId: ['orders.invalidParent'] })
    assertRecordAccess(actor, 'purchase-orders.read', po)
    if (po.status !== 'approved')
        throw new ApiError('validation', { purchaseOrderId: ['orders.invalidParent'] })
    if (previous && previous.purchaseOrderId !== po.id)
        throw new ApiError('validation', { purchaseOrderId: ['orders.parentLocked'] })
    if (
        (await transaction.list('orders')).some(
            (order) => order.id !== previous?.id && order.purchaseOrderId === po.id,
        )
    )
        throw new ApiError('conflict', { purchaseOrderId: ['orders.duplicate'] })
    const now = new Date().toISOString()
    return {
        purchaseOrderId: po.id,
        notes: mutation.input.notes,
        id: previous?.id ?? crypto.randomUUID(),
        version: (previous?.version ?? 0) + 1,
        status: previous?.status ?? 'draft',
        rejectionReason: previous?.rejectionReason ?? null,
        createdByUserId: previous?.createdByUserId ?? parseId(actor.id),
        submittedByUserId: previous?.submittedByUserId ?? null,
        createdAt: previous?.createdAt ?? now,
        updatedAt: now,
        allowedActions: [],
        purchaseOrderNumber: '',
        buyerName: '',
    }
}
async function transitionOrder(
    transaction: DemoTransaction,
    actor: SessionUser,
    mutation: OrderMutation,
    previous?: Order,
): Promise<Order> {
    if (!previous) throw new ApiError('not-found')
    const submitting = mutation.action === 'submit'
    if (
        submitting
            ? !['draft', 'rejected'].includes(previous.status)
            : previous.status !== 'submitted'
    )
        throw new ApiError('conflict')
    if (mutation.action !== 'reject') await assertOrderReady(transaction, previous)
    return {
        ...previous,
        status: submitting ? 'submitted' : mutation.action === 'approve' ? 'approved' : 'rejected',
        rejectionReason: 'reason' in mutation.input ? mutation.input.reason : null,
        submittedByUserId: submitting ? parseId(actor.id) : previous.submittedByUserId,
        version: previous.version + 1,
        updatedAt: new Date().toISOString(),
        allowedActions: [],
    }
}
