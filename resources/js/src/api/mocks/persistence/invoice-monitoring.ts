import type { Invoice } from '@/core/types/invoice'
import type { InvoiceSettlement } from '@/core/types/invoice-settlement'
import type { DemoTransaction } from './transaction'
import { activeInvoice, assertInvoiceCredit } from './invoice-settlement'
import { allocateInvoiceCredit } from '../invoice-term-balances'
import { sumMoney, moneyAmount, moneyUnits } from '@/core/domain/money-arithmetic'
export async function invoiceSettlement(
    transaction: DemoTransaction,
    invoice: Invoice,
    credit: string,
    operationalDate = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' }),
): Promise<InvoiceSettlement> {
    const issued = await activeInvoice(transaction, invoice)
    const invoiceAmount = issued?.totalAmount ?? '0.00'
    assertInvoiceCredit(invoiceAmount, credit)
    const terms = allocateInvoiceCredit(issued?.terms ?? [], credit, operationalDate)
    return {
        invoiceId: invoice.id,
        issuedRevisionNumber: issued?.revisionNumber ?? null,
        operationalDate,
        invoiceAmount,
        approvedCredit: credit,
        outstandingAmount: moneyAmount(moneyUnits(invoiceAmount) - moneyUnits(credit)),
        overdueAmount: sumMoney(
            terms.filter((term) => term.overdue).map((term) => term.outstandingAmount),
        ),
        terms,
    }
}
