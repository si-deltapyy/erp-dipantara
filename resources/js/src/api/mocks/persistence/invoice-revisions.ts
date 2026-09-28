import type { Invoice, InvoiceRevision } from '@/core/types/invoice'
import type { DemoTransaction } from './transaction'
import { sumMoney } from '@/core/domain/money-arithmetic'
import { assertInvoiceCredit, invoiceOutstanding } from './invoice-settlement'
export async function draftInvoiceRevision(
    transaction: DemoTransaction,
    previous: Invoice,
    input: InvoiceRevision,
    credit: string,
): Promise<Invoice> {
    const totalAmount = sumMoney(input.terms.map((term) => term.amount))
    assertInvoiceCredit(totalAmount, credit)
    await transaction.put('invoiceVersions', {
        id: `${previous.id}:${previous.revisionNumber}`,
        invoiceId: previous.id,
        invoice: previous,
    })
    return invoiceOutstanding(
        {
            ...previous,
            status: 'draft',
            revisionNumber: previous.revisionNumber + 1,
            version: previous.version + 1,
            terms: input.terms.map((term) => ({ ...term })),
            totalAmount,
            revisionReason: input.reason,
            documentId: null,
            updatedAt: new Date().toISOString(),
            allowedActions: [],
        },
        credit,
    )
}
export async function archiveInvoiceVersions(
    transaction: DemoTransaction,
    invoice: Invoice,
): Promise<void> {
    for (const version of await transaction.list('invoiceVersions')) {
        if (version.invoiceId !== invoice.id || version.invoice.status !== 'issued') continue
        await transaction.put('invoiceVersions', {
            ...version,
            invoice: { ...version.invoice, status: 'superseded', allowedActions: [] },
        })
    }
    await transaction.put('invoiceVersions', {
        id: `${invoice.id}:${invoice.revisionNumber}`,
        invoiceId: invoice.id,
        invoice,
    })
}
