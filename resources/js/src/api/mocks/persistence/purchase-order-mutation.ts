import { parseId } from '@/api/contracts/value-parsers'
import type {
    PurchaseOrder,
    PurchaseOrderInput,
    PurchaseOrderUpdate,
} from '@/core/types/purchase-order'
import type { SessionUser } from '@/core/types/session'
import { ApiError } from '@/core/types/api-error'
import { assertRecordAccess } from '@/core/domain/record-policy'
import { isEditablePurchaseOrder } from '@/core/domain/purchase-order-policy'
import { calculatePurchaseOrderTotal } from '../purchase-order-total'
import { resolvePurchaseOrderLabels } from './purchase-order-labels'
import type { DemoTransaction } from './transaction'
import type { DatasetMetadata } from './schema'

export interface PurchaseOrderMutation {
    readonly action: 'create' | 'update' | 'submit'
    readonly id?: string
    readonly input: PurchaseOrderInput | PurchaseOrderUpdate | { readonly version: number }
    readonly key: string
    readonly hash: string
}
export async function writePurchaseOrder(
    transaction: DemoTransaction,
    metadata: DatasetMetadata,
    actor: SessionUser,
    mutation: PurchaseOrderMutation,
): Promise<PurchaseOrder> {
    const path = `/api/v1/purchase-orders${mutation.id ? `/${mutation.id}` : ''}${mutation.action === 'submit' ? '/submit' : ''}`
    const receiptId = JSON.stringify([
        actor.id,
        mutation.action === 'update' ? 'PUT' : 'POST',
        path,
        mutation.key,
    ])
    const previous = mutation.id ? await transaction.get('purchase-orders', mutation.id) : undefined
    if (mutation.id) {
        if (!previous) throw new ApiError('not-found')
        assertRecordAccess(actor, `purchase-orders.${mutation.action}`, previous)
    }
    const receipt = await transaction.get('purchaseOrderMutations', receiptId)
    if (receipt && receipt.expiresAt > Date.now()) {
        if (receipt.payloadHash !== mutation.hash) throw new ApiError('conflict')
        return resolvePurchaseOrderLabels(transaction, receipt.result)
    }
    if (
        previous &&
        (!isEditablePurchaseOrder(previous) ||
            !('version' in mutation.input) ||
            previous.version !== mutation.input.version)
    )
        throw new ApiError('conflict')
    await assertUniqueNumber(transaction, mutation)
    const order = await resolvePurchaseOrderLabels(
        transaction,
        makeOrder(actor, mutation, previous),
    )
    await transaction.put('purchase-orders', order)
    await transaction.put('metadata', { ...metadata, revision: metadata.revision + 1 })
    await transaction.put('audit', {
        id: crypto.randomUUID(),
        resource: 'purchase-orders',
        recordId: order.id,
        actorId: actor.id,
        version: order.version,
        action: mutation.action,
    })
    await transaction.put('purchaseOrderMutations', {
        id: receiptId,
        payloadHash: mutation.hash,
        expiresAt: Date.now() + 86400000,
        result: order,
    })
    return order
}
async function assertUniqueNumber(
    transaction: DemoTransaction,
    mutation: PurchaseOrderMutation,
): Promise<void> {
    if (!('number' in mutation.input)) return
    const number = mutation.input.number
    const duplicate = (await transaction.list('purchase-orders')).some(
        (order) => order.id !== mutation.id && order.number === number,
    )
    if (duplicate) throw new ApiError('validation', { number: ['purchase-orders.duplicateNumber'] })
}
function makeOrder(
    actor: SessionUser,
    mutation: PurchaseOrderMutation,
    previous?: PurchaseOrder,
): PurchaseOrder {
    const now = new Date().toISOString()
    if (mutation.action === 'submit' && previous)
        return {
            ...previous,
            status: 'submitted',
            submittedByUserId: parseId(actor.id),
            version: previous.version + 1,
            updatedAt: now,
            allowedActions: [],
        }
    if (!('lines' in mutation.input)) throw new ApiError('validation')
    const input = mutation.input
    return {
        buyerId: input.buyerId,
        number: input.number,
        orderDate: input.orderDate,
        notes: input.notes,
        lines: input.lines.map((line) => ({ ...line, timberProductName: '' })),
        buyerName: '',
        id: previous?.id ?? crypto.randomUUID(),
        version: (previous?.version ?? 0) + 1,
        status: previous?.status ?? 'draft',
        totalAmount: calculatePurchaseOrderTotal(input.lines),
        createdAt: previous?.createdAt ?? now,
        updatedAt: now,
        createdByUserId: previous?.createdByUserId ?? parseId(actor.id),
        submittedByUserId: previous?.submittedByUserId ?? null,
        allowedActions: [],
    }
}
