import type { SessionUser } from '@/core/types/session'
import type { DocumentParent } from '@/core/types/document'
import { ApiError } from '@/core/types/api-error'
import { assertRecordAccess, hasBusinessPermission } from '@/core/domain/record-policy'
import type { DemoTransaction } from './transaction'
import type { StoredDocument } from './document-schema'

export type DocumentAction = 'read' | 'upload' | 'download'
export function requireDocumentPermission(
    user: SessionUser | null,
    action: DocumentAction,
): SessionUser {
    if (!user) throw new ApiError('unauthenticated')
    if (!hasBusinessPermission(user, `documents.${action}`)) throw new ApiError('forbidden')
    return user
}
export async function assertDocumentParentAccess(
    transaction: DemoTransaction,
    actor: SessionUser,
    parent: DocumentParent,
    action: DocumentAction,
): Promise<void> {
    if (parent.parentType === 'delivery') {
        const delivery = await transaction.get('deliveries', parent.parentId)
        if (!delivery) throw new ApiError('not-found')
        const po = await transaction.get('purchase-orders', delivery.purchaseOrderId)
        if (!po) throw new ApiError('not-found')
        const scope = { ...delivery, ownerUserId: po.createdByUserId }
        assertRecordAccess(actor, 'deliveries.read', scope)
        assertRecordAccess(actor, `documents.${action}`, scope)
        if (
            action === 'upload' &&
            (delivery.status !== 'draft' || !actor.permissions.includes('deliveries.update.all'))
        )
            throw new ApiError('forbidden')
        return
    }
    if (parent.parentType !== 'purchase-order') throw new ApiError('not-found')
    const order = await transaction.get('purchase-orders', parent.parentId)
    if (!order) throw new ApiError('not-found')
    assertRecordAccess(actor, 'purchase-orders.read', order)
    assertRecordAccess(actor, `documents.${action}`, order)
}
export async function assertStoredDocumentAccess(
    transaction: DemoTransaction,
    actor: SessionUser,
    document: StoredDocument,
    action: DocumentAction,
): Promise<void> {
    if (document.parentId !== null) {
        await assertDocumentParentAccess(
            transaction,
            actor,
            { parentType: document.parentType, parentId: document.parentId },
            action,
        )
        return
    }
    if (
        document.createdByUserId !== actor.id ||
        document.expiresAt === null ||
        document.expiresAt <= Date.now()
    )
        throw new ApiError('not-found')
}
