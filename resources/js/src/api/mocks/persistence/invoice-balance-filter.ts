import type { Invoice } from '@/core/types/invoice'
import type { DemoTransaction } from './transaction'
import type { InvoiceCreditResolver } from './invoice-settlement'
import { invoiceOutstanding } from './invoice-settlement'
import { moneyUnits } from '@/core/domain/money-arithmetic'
export async function outstandingInvoices(
    transaction: DemoTransaction,
    invoices: readonly Invoice[],
    credits: InvoiceCreditResolver,
): Promise<readonly Invoice[]> {
    const balances = await Promise.all(
        invoices
            .filter((invoice) => !!invoice.issuedRevisionNumber)
            .map(async (invoice) =>
                invoiceOutstanding(invoice, await credits(transaction, invoice.id)),
            ),
    )
    return balances.filter((invoice) => moneyUnits(invoice.outstandingAmount) > 0n)
}
