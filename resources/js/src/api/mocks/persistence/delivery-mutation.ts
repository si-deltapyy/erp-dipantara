import type { WorkflowVersion } from '@/core/types/workflow'
import { assertDeliveryDocuments, transitionDelivery } from './delivery-readiness'
import type { Delivery, DeliveryInput } from '@/core/types/delivery'
import type { SessionUser } from '@/core/types/session'
import type { DemoTransaction } from './transaction'
import type { DatasetMetadata } from './schema'
import { ApiError } from '@/core/types/api-error'
import { parseId } from '@/api/contracts/value-parsers'
import { assertRecordAccess } from '@/core/domain/record-policy'
import { deliveryAvailability } from './delivery-availability'

export interface DeliveryMutation {
    readonly action: 'create' | 'update' | 'dispatch' | 'receive'
    readonly id?: string
    readonly input: (DeliveryInput & { readonly version?: number }) | WorkflowVersion
    readonly key: string
    readonly hash: string
}
export async function writeDelivery(
    transaction: DemoTransaction,
    metadata: DatasetMetadata,
    actor: SessionUser,
    mutation: DeliveryMutation,
): Promise<Delivery> {
    const previous = mutation.id ? await transaction.get('deliveries', mutation.id) : undefined
    if (mutation.id && !previous) throw new ApiError('not-found')
    const receiptId = JSON.stringify([actor.id, mutation.action, mutation.id ?? '', mutation.key])
    const receipt = await transaction.get('deliveryMutations', receiptId)
    if (receipt && receipt.expiresAt > Date.now()) {
        if (receipt.payloadHash !== mutation.hash) throw new ApiError('conflict')
        return withDeliveryOwner(transaction, receipt.result)
    }
    if (previous && previous.version !== mutation.input.version) throw new ApiError('conflict')
    if (
        'availabilityToken' in mutation.input &&
        mutation.input.availabilityToken !== `${metadata.generation}:${metadata.revision}`
    )
        throw new ApiError('conflict', { allocations: ['deliveries.staleStock'] })
    const candidate =
        'allocations' in mutation.input
            ? await draftDelivery(transaction, actor, mutation.input, previous)
            : await transitionDelivery(transaction, previous, mutation.action)
    const delivery = await withDeliveryOwner(transaction, candidate)
    await transaction.put('deliveries', delivery)
    await transaction.put('metadata', { ...metadata, revision: metadata.revision + 1 })
    await transaction.put('audit', {
        id: crypto.randomUUID(),
        resource: 'deliveries',
        recordId: delivery.id,
        actorId: actor.id,
        version: delivery.version,
        action: mutation.action,
    })
    await transaction.put('deliveryMutations', {
        id: receiptId,
        payloadHash: mutation.hash,
        expiresAt: Date.now() + 86400000,
        result: delivery,
    })
    return delivery
}
async function draftDelivery(
    transaction: DemoTransaction,
    actor: SessionUser,
    input: DeliveryInput,
    previous?: Delivery,
): Promise<Delivery> {
    const po = await transaction.get('purchase-orders', input.purchaseOrderId)
    if (!po || po.status !== 'approved')
        throw new ApiError('validation', { purchaseOrderId: ['deliveries.invalidParent'] })
    assertRecordAccess(actor, 'purchase-orders.read', po)
    if (previous && previous.purchaseOrderId !== po.id) throw new ApiError('conflict')
    if (previous && previous.status !== 'draft') throw new ApiError('conflict')
    await assertDeliveryDocuments(transaction, previous?.id, input.documents)
    const available = await deliveryAvailability(transaction, po.id, previous?.id)
    const allocationContext = input.allocations.map((allocation, index) => {
        const row = available.find(
            (row) => row.gradingId === allocation.gradingId && row.rowId === allocation.rowId,
        )
        if (!row || allocation.quantity > row.availableQuantity)
            throw new ApiError('conflict', {
                [`allocations.${index}.quantity`]: ['deliveries.insufficientStock'],
            })
        return {
            ...allocation,
            assignmentId: row.assignmentId,
            mitraName: row.mitraName,
            timberProductName: row.timberProductName,
        }
    })
    const now = new Date().toISOString()
    return {
        id: previous?.id ?? crypto.randomUUID(),
        purchaseOrderId: po.id,
        ownerUserId: po.createdByUserId,
        purchaseOrderNumber: po.number,
        buyerName: po.buyerName,
        deliveryDate: input.deliveryDate,
        licensePlate: input.licensePlate,
        allocations: input.allocations.map((row) => ({ ...row })),
        allocationContext,
        documents: input.documents.map((document) => ({ ...document })),
        version: (previous?.version ?? 0) + 1,
        status: 'draft',
        createdByUserId: previous?.createdByUserId ?? parseId(actor.id),
        submittedByUserId: null,
        allowedActions: [],
        createdAt: previous?.createdAt ?? now,
        updatedAt: now,
    }
}

async function withDeliveryOwner(
    transaction: DemoTransaction,
    delivery: Delivery,
): Promise<Delivery> {
    const purchaseOrder = await transaction.get('purchase-orders', delivery.purchaseOrderId)
    if (!purchaseOrder) throw new ApiError('not-found')
    return { ...delivery, ownerUserId: purchaseOrder.createdByUserId }
}
