import type { PurchaseOrder } from '@/core/types/purchase-order'
import { useDocumentTransfer } from './useDocumentTransfer'
import type { DocumentUploadState } from './useDocumentTransfer'
export function useDocumentUpload(
    order: () => PurchaseOrder,
    onUploaded: () => Promise<void>,
): DocumentUploadState {
    return useDocumentTransfer(
        () => ({
            identity: order().id,
            parentType: 'purchase-order',
            parentId: order().id,
            purpose: 'approved_po',
            scope: order(),
            permitted: order().status !== 'closed',
        }),
        onUploaded,
    )
}
