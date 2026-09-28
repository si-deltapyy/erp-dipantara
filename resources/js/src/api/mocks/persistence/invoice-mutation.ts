import { draftInvoiceRevision, archiveInvoiceVersions } from './invoice-revisions'
import {
    assertInvoiceCredit,
    invoiceOutstanding,
    normalizeIssuedInvoice,
} from './invoice-settlement'
import type { Invoice, InvoiceInput, InvoiceVersion, InvoiceRevision } from '@/core/types/invoice'
import type { SessionUser } from '@/core/types/session'
import type { DemoTransaction } from './transaction'
import type { DatasetMetadata } from './schema'
import { ApiError } from '@/core/types/api-error'
import { parseId } from '@/api/contracts/value-parsers'
import { assertRecordAccess } from '@/core/domain/record-policy'
import { sumMoney } from '@/core/domain/money-arithmetic'
import { issueInvoiceDocument } from './invoice-document'
export interface InvoiceMutation {
    readonly action: 'create' | 'update' | 'issue' | 'revise'
    readonly id?: string
    readonly input:
        | (InvoiceInput & { version?: number; revisionNumber?: number })
        | InvoiceVersion
        | InvoiceRevision
    readonly key: string
    readonly hash: string
}
export async function writeInvoice(
    transaction: DemoTransaction,
    metadata: DatasetMetadata,
    actor: SessionUser,
    mutation: InvoiceMutation,
    credit: string,
): Promise<Invoice> {
    const stored = mutation.id ? await transaction.get('invoices', mutation.id) : undefined
    const previous = stored ? normalizeIssuedInvoice(stored) : undefined
    if (mutation.id && !previous) throw new ApiError('not-found')
    if (previous) assertRecordAccess(actor, `invoices.${mutation.action}`, previous)
    const receiptId = JSON.stringify([actor.id, mutation.action, mutation.id ?? '', mutation.key])
    const receipt = await transaction.get('invoiceMutations', receiptId)
    if (receipt && receipt.expiresAt > Date.now()) {
        if (receipt.payloadHash !== mutation.hash) throw new ApiError('conflict')
        return normalizeIssuedInvoice(receipt.result)
    }
    if (
        previous &&
        (previous.version !== mutation.input.version ||
            previous.status !== (mutation.action === 'revise' ? 'issued' : 'draft'))
    )
        throw new ApiError('conflict')
    if (
        previous &&
        'revisionNumber' in mutation.input &&
        previous.revisionNumber !== mutation.input.revisionNumber
    )
        throw new ApiError('conflict')
    let invoice =
        'reason' in mutation.input && previous
            ? await draftInvoiceRevision(transaction, previous, mutation.input, credit)
            : 'purchaseOrderId' in mutation.input
              ? await draftInvoice(transaction, actor, mutation.input, previous)
              : previous
    if (!invoice) throw new ApiError('validation')
    assertInvoiceCredit(invoice.totalAmount, credit)
    invoice = invoiceOutstanding(invoice, credit)
    if (mutation.action === 'issue') {
        const parent = await transaction.get('purchase-orders', invoice.purchaseOrderId)
        if (!parent || parent.status !== 'approved') throw new ApiError('conflict')
        invoice = {
            ...invoice,
            status: 'issued',
            issuedRevisionNumber: invoice.revisionNumber,
            issuedTotalAmount: invoice.totalAmount,
            outstandingAmount: invoiceOutstanding(
                { ...invoice, issuedTotalAmount: invoice.totalAmount },
                credit,
            ).outstandingAmount,
            number: `DEMO-INV-${invoice.invoiceDate.replaceAll('-', '')}-${String(metadata.revision).padStart(6, '0')}`,
            version: invoice.version + 1,
            updatedAt: new Date().toISOString(),
        }
        invoice = { ...invoice, documentId: await issueInvoiceDocument(transaction, invoice) }
        await archiveInvoiceVersions(transaction, invoice)
    }
    await transaction.put('invoices', invoice)
    await transaction.put('metadata', { ...metadata, revision: metadata.revision + 1 })
    await transaction.put('audit', {
        id: crypto.randomUUID(),
        resource: 'invoices',
        recordId: invoice.id,
        actorId: actor.id,
        version: invoice.version,
        action: mutation.action,
    })
    await transaction.put('invoiceMutations', {
        id: receiptId,
        payloadHash: mutation.hash,
        expiresAt: Date.now() + 86400000,
        result: invoice,
    })
    return invoice
}
async function draftInvoice(
    transaction: DemoTransaction,
    actor: SessionUser,
    input: InvoiceInput,
    previous?: Invoice,
): Promise<Invoice> {
    const po = await transaction.get('purchase-orders', input.purchaseOrderId)
    if (!po || po.status !== 'approved')
        throw new ApiError('validation', { purchaseOrderId: ['invoices.invalidParent'] })
    assertRecordAccess(actor, 'purchase-orders.read', po)
    if (
        previous &&
        (previous.purchaseOrderId !== po.id ||
            previous.direction !== input.direction ||
            previous.mitraId !== input.mitraId ||
            previous.kind !== input.kind)
    )
        throw new ApiError('conflict')
    const mitra = input.mitraId ? await transaction.get('mitras', input.mitraId) : undefined
    const orderIds = new Set(
        (await transaction.list('orders'))
            .filter((order) => order.purchaseOrderId === po.id)
            .map((order) => order.id),
    )
    if (
        input.direction === 'payable' &&
        (!mitra ||
            !(await transaction.list('assignments')).some(
                (assignment) => orderIds.has(assignment.orderId) && assignment.mitraId === mitra.id,
            ))
    )
        throw new ApiError('validation', { mitraId: ['invoices.invalidMitra'] })
    const totalAmount = sumMoney(input.terms.map((term) => term.amount))
    const now = new Date().toISOString()
    return {
        ...input,
        id: previous?.id ?? crypto.randomUUID(),
        ownerUserId: po.createdByUserId,
        purchaseOrderNumber: po.number,
        counterpartyName: mitra?.name ?? po.buyerName,
        status: 'draft',
        number: null,
        totalAmount,
        outstandingAmount: totalAmount,
        revisionNumber: previous?.revisionNumber ?? 1,
        issuedRevisionNumber: previous?.issuedRevisionNumber ?? null,
        issuedTotalAmount: previous?.issuedTotalAmount ?? null,
        revisionReason: previous?.revisionReason ?? null,
        documentId: null,
        createdAt: previous?.createdAt ?? now,
        updatedAt: now,
        version: (previous?.version ?? 0) + 1,
        createdByUserId: previous?.createdByUserId ?? parseId(actor.id),
        submittedByUserId: null,
        allowedActions: [],
    }
}
