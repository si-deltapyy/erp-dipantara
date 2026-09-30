import type {
    InvoiceBalanceTotals,
    InvoiceDirectionSummary,
    PurchaseOrderInvoiceSummary,
} from '@/core/types/invoice-summary'
import {
    parseId,
    parseInteger,
    parseMoney,
    parseObject,
    requireKeys,
    invalidContract,
} from './contracts/value-parsers'
import { parseDeliveryDate } from './contracts/delivery-input'
import { moneyUnits } from '@/core/domain/money-arithmetic'
const balanceKeys = [
    'issuedInvoiceCount',
    'invoiceAmount',
    'approvedCredit',
    'outstandingAmount',
    'overdueAmount',
]
function parseBalances(value: unknown, direction = false): InvoiceBalanceTotals {
    const record = parseObject(value, 'balances')
    requireKeys(record, [...balanceKeys, ...(direction ? ['downPayment'] : [])], 'balances')
    const totals = {
        issuedInvoiceCount: parseInteger(record.issuedInvoiceCount, 'issuedInvoiceCount', 0),
        invoiceAmount: parseMoney(record.invoiceAmount, 'invoiceAmount'),
        approvedCredit: parseMoney(record.approvedCredit, 'approvedCredit'),
        outstandingAmount: parseMoney(record.outstandingAmount, 'outstandingAmount'),
        overdueAmount: parseMoney(record.overdueAmount, 'overdueAmount'),
    }
    if (
        [
            totals.invoiceAmount,
            totals.approvedCredit,
            totals.outstandingAmount,
            totals.overdueAmount,
        ].some((amount) => moneyUnits(amount) < 0n) ||
        moneyUnits(totals.invoiceAmount) !==
            moneyUnits(totals.approvedCredit) + moneyUnits(totals.outstandingAmount) ||
        moneyUnits(totals.overdueAmount) > moneyUnits(totals.outstandingAmount)
    )
        return invalidContract('balances')
    return totals
}
function parseDirection(value: unknown): InvoiceDirectionSummary {
    const record = parseObject(value, 'direction')
    const totals = parseBalances(record, true)
    const downPayment = parseBalances(record.downPayment)
    if (
        downPayment.issuedInvoiceCount > totals.issuedInvoiceCount ||
        ['invoiceAmount', 'approvedCredit', 'outstandingAmount', 'overdueAmount'].some(
            (key) =>
                moneyUnits(
                    downPayment[key as Exclude<keyof InvoiceBalanceTotals, 'issuedInvoiceCount'>],
                ) >
                moneyUnits(
                    totals[key as Exclude<keyof InvoiceBalanceTotals, 'issuedInvoiceCount'>],
                ),
        )
    )
        return invalidContract('downPayment')
    return { ...totals, downPayment }
}
export function parseInvoiceSummary(value: unknown): PurchaseOrderInvoiceSummary {
    const record = parseObject(value, 'summary')
    requireKeys(record, ['purchaseOrderId', 'operationalDate', 'receivable', 'payable'], 'summary')
    return {
        purchaseOrderId: parseId(record.purchaseOrderId),
        operationalDate: parseDeliveryDate(record.operationalDate, 'operationalDate'),
        receivable: parseDirection(record.receivable),
        payable: parseDirection(record.payable),
    }
}
