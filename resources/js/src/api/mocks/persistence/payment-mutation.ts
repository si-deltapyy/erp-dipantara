import { assertOpenPurchaseOrder } from './closed-order-guard'
import { reviewPayment } from './payment-review'
import { parseId } from '@/api/contracts/value-parsers'
import type { Payment, PaymentInput } from '@/core/types/payment'
import type { WorkflowVersion, WorkflowRejection } from '@/core/types/workflow'
import type { SessionUser } from '@/core/types/session'
import type { DatasetMetadata } from './schema'
import type { DemoTransaction } from './transaction'
import { ApiError } from '@/core/types/api-error'
import { assertRecordAccess } from '@/core/domain/record-policy'
import { draftPayment } from './payment-draft'
import { bindPaymentProof } from './payment-proof'
import { paymentInvoice, paymentAccounts } from './payment-context'
export interface PaymentMutation {
    readonly action: 'create' | 'update' | 'submit' | 'approve' | 'reject'
    readonly id?: string
    readonly input:
        (PaymentInput & { readonly version?: number }) | WorkflowVersion | WorkflowRejection
    readonly key: string
    readonly hash: string
}
export async function writePayment(
    transaction: DemoTransaction,
    metadata: DatasetMetadata,
    actor: SessionUser,
    mutation: PaymentMutation,
): Promise<Payment> {
    const previous = mutation.id ? await transaction.get('payments', mutation.id) : undefined
    if (mutation.id && !previous) throw new ApiError('not-found')
    if (previous) assertRecordAccess(actor, `payments.${mutation.action}`, previous)
    if (previous) await assertOpenPurchaseOrder(transaction, previous.purchaseOrderId)
    if ('invoiceId' in mutation.input)
        await paymentInvoice(transaction, actor, mutation.input.invoiceId)
    const receiptId = JSON.stringify([actor.id, mutation.action, mutation.id ?? '', mutation.key])
    const receipt = await transaction.get('paymentMutations', receiptId)
    if (receipt && receipt.expiresAt > Date.now()) {
        if (receipt.payloadHash !== mutation.hash) throw new ApiError('conflict')
        assertRecordAccess(actor, `payments.${mutation.action}`, receipt.result)
        return receipt.result
    }
    if (
        previous &&
        (previous.version !== mutation.input.version ||
            !(mutation.action === 'approve' || mutation.action === 'reject'
                ? previous.status === 'submitted'
                : ['draft', 'rejected'].includes(previous.status)))
    )
        throw new ApiError('conflict')
    let payment =
        'invoiceId' in mutation.input
            ? await draftPayment(transaction, actor, mutation.input, previous)
            : previous
    if (!payment) throw new ApiError('validation')
    const invoice = await paymentInvoice(transaction, actor, payment.invoiceId)
    await paymentAccounts(transaction, payment, invoice)
    if (mutation.action === 'approve' || mutation.action === 'reject')
        payment = await reviewPayment(
            transaction,
            payment,
            mutation.action,
            'reason' in mutation.input ? mutation.input.reason : null,
        )
    await transaction.put('payments', payment)
    await bindPaymentProof(transaction, actor, payment.id, payment.proofDocumentId)
    if (mutation.action === 'submit')
        payment = {
            ...payment,
            status: 'submitted',
            submittedByUserId: parseId(actor.id),
            rejectionReason: null,
            version: payment.version + 1,
            updatedAt: new Date().toISOString(),
        }
    await transaction.put('payments', payment)
    await transaction.put('metadata', { ...metadata, revision: metadata.revision + 1 })
    await transaction.put('audit', {
        id: crypto.randomUUID(),
        resource: 'payments',
        recordId: payment.id,
        actorId: actor.id,
        version: payment.version,
        action: mutation.action,
        ...('reason' in mutation.input ? { reason: mutation.input.reason } : {}),
    })
    await transaction.put('paymentMutations', {
        id: receiptId,
        payloadHash: mutation.hash,
        expiresAt: Date.now() + 86400000,
        result: payment,
    })
    return payment
}
