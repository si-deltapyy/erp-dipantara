import type { Invoice } from '@/core/types/invoice'
import type { DemoTransaction } from './transaction'
import { moneyAmount, moneyUnits } from '@/core/domain/money-arithmetic'
import { ApiError } from '@/core/types/api-error'
export type InvoiceCreditResolver = (
    transaction: DemoTransaction,
    invoiceId: string,
) => Promise<string>
export const invoiceCreditFixture: InvoiceCreditResolver = async () => '0.00'
export function normalizeIssuedInvoice(invoice: Invoice): Invoice {
    return {
        ...invoice,
        issuedRevisionNumber:
            invoice.issuedRevisionNumber ??
            (invoice.status === 'issued' ? invoice.revisionNumber : null),
        issuedTotalAmount:
            invoice.issuedTotalAmount ?? (invoice.status === 'issued' ? invoice.totalAmount : null),
        revisionReason: invoice.revisionReason ?? null,
    }
}
export function invoiceOutstanding(invoice: Invoice, credit: string): Invoice {
    const base = invoice.issuedTotalAmount ?? invoice.totalAmount
    return { ...invoice, outstandingAmount: moneyAmount(moneyUnits(base) - moneyUnits(credit)) }
}
export function assertInvoiceCredit(total: string, credit: string): void {
    if (moneyUnits(total) < moneyUnits(credit))
        throw new ApiError('conflict', { terms: ['invoices.belowCredit'] })
}
export async function activeInvoice(
    transaction: DemoTransaction,
    invoice: Invoice,
): Promise<Invoice | undefined> {
    if (invoice.status === 'issued') return invoice
    if (!invoice.issuedRevisionNumber) return undefined
    return (
        await transaction.get('invoiceVersions', `${invoice.id}:${invoice.issuedRevisionNumber}`)
    )?.invoice
}
