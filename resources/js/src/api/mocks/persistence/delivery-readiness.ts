import type { Delivery, DeliveryDocument } from '@/core/types/delivery'
import type { DemoTransaction } from './transaction'
import { ApiError } from '@/core/types/api-error'
export async function assertDeliveryDocuments(
    transaction: DemoTransaction,
    deliveryId: string | undefined,
    references: readonly DeliveryDocument[],
): Promise<void> {
    const ids = new Set<string>()
    for (const [index, reference] of references.entries()) {
        const document = await transaction.get('documents', reference.documentId)
        if (
            !deliveryId ||
            !document ||
            document.parentType !== 'delivery' ||
            document.parentId !== deliveryId ||
            document.purpose !== 'sakr' ||
            document.mimeType !== 'application/pdf' ||
            ids.has(document.id)
        )
            throw new ApiError('validation', {
                [`documents.${index}.documentId`]: ['deliveries.invalidDocument'],
            })
        ids.add(document.id)
    }
}
export async function transitionDelivery(
    transaction: DemoTransaction,
    delivery: Delivery | undefined,
    action: string,
): Promise<Delivery> {
    if (!delivery) throw new ApiError('not-found')
    if (action !== 'dispatch' && action !== 'receive') throw new ApiError('validation')
    if (delivery.status !== (action === 'dispatch' ? 'draft' : 'dispatched'))
        throw new ApiError('conflict')
    if (action === 'dispatch') {
        if (
            delivery.documents.length !== 2 ||
            new Set(delivery.documents.map((document) => document.direction)).size !== 2
        )
            throw new ApiError('validation', { documents: ['deliveries.incompleteDocuments'] })
        await assertDeliveryDocuments(transaction, delivery.id, delivery.documents)
    }
    return {
        ...delivery,
        status: action === 'dispatch' ? 'dispatched' : 'received',
        version: delivery.version + 1,
        updatedAt: new Date().toISOString(),
        allowedActions: [],
    }
}
