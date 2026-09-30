import type { InvoiceSettlement, InvoiceTermBalance } from '@/core/types/invoice-settlement'
import {
    invalidContract,
    parseId,
    parseInteger,
    parseMoney,
    parseObject,
    requireKeys,
} from './contracts/value-parsers'
import { parseDeliveryDate } from './contracts/delivery-input'
import { parseInvoiceTerms } from './contracts/invoice-input'
import { moneyUnits, sumMoney } from '@/core/domain/money-arithmetic'
export function parseInvoiceSettlement(value: unknown): InvoiceSettlement {
    const record = parseObject(value, 'settlement')
    requireKeys(
        record,
        [
            'invoiceId',
            'issuedRevisionNumber',
            'operationalDate',
            'invoiceAmount',
            'approvedCredit',
            'outstandingAmount',
            'overdueAmount',
            'terms',
        ],
        'settlement',
    )
    if (!Array.isArray(record.terms)) return invalidContract('terms')
    const terms = record.terms.map(parseTermBalance)
    const invoiceAmount = parseMoney(record.invoiceAmount, 'invoiceAmount')
    const approvedCredit = parseMoney(record.approvedCredit, 'approvedCredit')
    const outstandingAmount = parseMoney(record.outstandingAmount, 'outstandingAmount')
    const overdueAmount = parseMoney(record.overdueAmount, 'overdueAmount')
    if (
        [invoiceAmount, approvedCredit, outstandingAmount, overdueAmount].some(
            (amount) => moneyUnits(amount) < 0n,
        ) ||
        moneyUnits(invoiceAmount) - moneyUnits(approvedCredit) !== moneyUnits(outstandingAmount) ||
        sumMoney(terms.map((term) => term.outstandingAmount)) !== outstandingAmount
    )
        return invalidContract('outstandingAmount')
    if (
        sumMoney(terms.map((term) => term.amount)) !== invoiceAmount ||
        sumMoney(terms.map((term) => term.settledAmount)) !== approvedCredit ||
        sumMoney(terms.filter((term) => term.overdue).map((term) => term.outstandingAmount)) !==
            overdueAmount
    )
        return invalidContract('terms')
    return {
        invoiceId: parseId(record.invoiceId),
        issuedRevisionNumber:
            record.issuedRevisionNumber === null
                ? null
                : parseInteger(record.issuedRevisionNumber, 'issuedRevisionNumber'),
        operationalDate: parseDeliveryDate(record.operationalDate, 'operationalDate'),
        invoiceAmount,
        approvedCredit,
        outstandingAmount,
        overdueAmount,
        terms,
    }
}
function parseTermBalance(value: unknown, index: number): InvoiceTermBalance {
    const record = parseObject(value, `terms.${index}`)
    requireKeys(
        record,
        ['index', 'label', 'amount', 'dueDate', 'settledAmount', 'outstandingAmount', 'overdue'],
        `terms.${index}`,
    )
    const term = parseInvoiceTerms([
        { label: record.label, amount: record.amount, dueDate: record.dueDate },
    ])[0]
    if (!term || typeof record.overdue !== 'boolean' || record.index !== index)
        return invalidContract(`terms.${index}`)
    const settledAmount = parseMoney(record.settledAmount, 'settledAmount')
    const outstandingAmount = parseMoney(record.outstandingAmount, 'outstandingAmount')
    if (
        moneyUnits(settledAmount) < 0n ||
        moneyUnits(outstandingAmount) < 0n ||
        moneyUnits(term.amount) !== moneyUnits(settledAmount) + moneyUnits(outstandingAmount)
    )
        return invalidContract(`terms.${index}`)
    return { ...term, index, settledAmount, outstandingAmount, overdue: record.overdue }
}
