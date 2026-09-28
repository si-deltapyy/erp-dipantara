import type { Invoice } from '@/core/types/invoice'
import type { InvoiceSettlement } from '@/core/types/invoice-settlement'
import type {
    InvoiceBalanceTotals,
    InvoiceDirectionSummary,
    PurchaseOrderInvoiceSummary,
} from '@/core/types/invoice-summary'
import type { SessionUser } from '@/core/types/session'
import type { DemoTransaction } from './transaction'
import type { InvoiceCreditResolver } from './invoice-settlement'
import { normalizeIssuedInvoice } from './invoice-settlement'
import { invoiceSettlement } from './invoice-monitoring'
import { evaluateRecordAccess } from '@/core/domain/record-policy'
import { sumMoney } from '@/core/domain/money-arithmetic'
interface IssuedBalance {
    readonly invoice: Invoice
    readonly settlement: InvoiceSettlement
}
function balanceTotals(balances: readonly IssuedBalance[]): InvoiceBalanceTotals {
    const sum = (
        field: 'invoiceAmount' | 'approvedCredit' | 'outstandingAmount' | 'overdueAmount',
    ): string => sumMoney(balances.map((balance) => balance.settlement[field]))
    return {
        issuedInvoiceCount: balances.length,
        invoiceAmount: sum('invoiceAmount'),
        approvedCredit: sum('approvedCredit'),
        outstandingAmount: sum('outstandingAmount'),
        overdueAmount: sum('overdueAmount'),
    }
}
function directionSummary(
    balances: readonly IssuedBalance[],
    direction: Invoice['direction'],
): InvoiceDirectionSummary {
    const selected = balances.filter((balance) => balance.invoice.direction === direction)
    return {
        ...balanceTotals(selected),
        downPayment: balanceTotals(
            selected.filter((balance) => balance.invoice.kind === 'down_payment'),
        ),
    }
}
export async function purchaseOrderInvoiceSummary(
    transaction: DemoTransaction,
    actor: SessionUser,
    purchaseOrderId: string,
    credits: InvoiceCreditResolver,
): Promise<PurchaseOrderInvoiceSummary> {
    const operationalDate = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })
    const invoices = (await transaction.list('invoices'))
        .map(normalizeIssuedInvoice)
        .filter(
            (invoice) =>
                invoice.purchaseOrderId === purchaseOrderId &&
                !!invoice.issuedRevisionNumber &&
                evaluateRecordAccess(actor, 'invoices.read', invoice) === 'allowed',
        )
    const balances: IssuedBalance[] = []
    for (const invoice of invoices)
        balances.push({
            invoice,
            settlement: await invoiceSettlement(
                transaction,
                invoice,
                await credits(transaction, invoice.id),
                operationalDate,
            ),
        })
    return {
        purchaseOrderId,
        operationalDate,
        receivable: directionSummary(balances, 'receivable'),
        payable: directionSummary(balances, 'payable'),
    }
}
