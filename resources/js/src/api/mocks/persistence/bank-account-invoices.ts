import type { DemoTransaction } from './transaction'
import type { BankAccountInvoiceLink } from '../bank-account-lookup-scope'
export async function invoiceAccountLinks(
    transaction: DemoTransaction,
): Promise<readonly BankAccountInvoiceLink[]> {
    const links: BankAccountInvoiceLink[] = []
    for (const invoice of await transaction.list('invoices')) {
        const po = await transaction.get('purchase-orders', invoice.purchaseOrderId)
        if (!po) continue
        links.push({
            invoiceId: invoice.id,
            ownerUserId: po.createdByUserId,
            counterpartyType: invoice.direction === 'receivable' ? 'buyer' : 'mitra',
            counterpartyId: invoice.mitraId ?? po.buyerId,
        })
    }
    return links
}
