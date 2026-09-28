import type { SessionUser } from '@/core/types/session'
import type { DemoTransaction } from './transaction'
import { ApiError } from '@/core/types/api-error'
import { bindStagedDocuments } from './document-binding'
export async function bindPaymentProof(
    transaction: DemoTransaction,
    actor: SessionUser,
    paymentId: string,
    documentId: string,
): Promise<void> {
    const document = await transaction.get('documents', documentId)
    if (!document || document.parentType !== 'payment' || document.purpose !== 'payment_proof')
        throw new ApiError('validation', { proofDocumentId: ['payments.invalidProof'] })
    if (document.parentId === paymentId) return
    if (document.parentId !== null) throw new ApiError('not-found')
    await bindStagedDocuments(
        transaction,
        actor,
        { parentType: 'payment', parentId: paymentId },
        'payment_proof',
        [documentId],
    )
}
