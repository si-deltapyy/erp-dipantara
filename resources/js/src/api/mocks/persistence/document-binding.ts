import type { DocumentParent, DocumentPurpose } from '@/core/types/document'
import type { SessionUser } from '@/core/types/session'
import { ApiError } from '@/core/types/api-error'
import type { DemoTransaction } from './transaction'
import { assertDocumentParentAccess, requireDocumentPermission } from './document-policy'

export async function bindStagedDocuments(
    transaction: DemoTransaction,
    user: SessionUser | null,
    parent: DocumentParent,
    purpose: DocumentPurpose,
    documentIds: readonly string[],
): Promise<void> {
    const actor = requireDocumentPermission(user, 'upload')
    await assertDocumentParentAccess(transaction, actor, parent, 'upload')
    for (const id of documentIds) {
        const document = await transaction.get('documents', id)
        if (!document || document.createdByUserId !== actor.id) throw new ApiError('not-found')
        if (
            document.parentType !== parent.parentType ||
            document.purpose !== purpose ||
            document.parentId !== null ||
            document.expiresAt === null ||
            document.expiresAt <= Date.now()
        )
            throw new ApiError('conflict')
        await transaction.put('documents', {
            ...document,
            parentId: parent.parentId,
            expiresAt: null,
        })
    }
}
