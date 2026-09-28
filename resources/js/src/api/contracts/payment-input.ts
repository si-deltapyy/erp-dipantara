import type { PaymentInput } from '@/core/types/payment'
import {
    invalidContract,
    parseId,
    parseInteger,
    parseMoney,
    parseObject,
    parseString,
    requireKeys,
} from './value-parsers'
import { parseDeliveryDate } from './delivery-input'
import { moneyUnits, sumMoney } from '@/core/domain/money-arithmetic'
export function parsePaymentInput(
    value: unknown,
    updating = false,
): PaymentInput & { version?: number } {
    const record = parseObject(value, 'payment')
    requireKeys(
        record,
        [
            'invoiceId',
            'paymentDate',
            'sourceAccountId',
            'destinationAccountId',
            'cashAmount',
            'withholdingAmount',
            'roundingAdjustment',
            'proofDocumentId',
            'notes',
            ...(updating ? ['version'] : []),
        ],
        'payment',
    )
    const amounts = {
        cashAmount: parseMoney(record.cashAmount, 'cashAmount'),
        withholdingAmount: parseMoney(record.withholdingAmount, 'withholdingAmount'),
        roundingAdjustment: parseMoney(record.roundingAdjustment, 'roundingAdjustment'),
    }
    for (const [field, amount] of Object.entries(amounts))
        if (amount.length > 20 || (field !== 'roundingAdjustment' && moneyUnits(amount) < 0n))
            return invalidContract(field)
    if (moneyUnits(sumMoney(Object.values(amounts))) <= 0n) return invalidContract('cashAmount')
    const notes = record.notes == null ? null : parseString(record.notes, 'notes').trim()
    if (notes && notes.length > 2000) return invalidContract('notes')
    return {
        ...amounts,
        invoiceId: parseId(record.invoiceId, 'invoiceId'),
        paymentDate: parseDeliveryDate(record.paymentDate, 'paymentDate'),
        sourceAccountId: parseId(record.sourceAccountId, 'sourceAccountId'),
        destinationAccountId: parseId(record.destinationAccountId, 'destinationAccountId'),
        proofDocumentId: parseId(record.proofDocumentId, 'proofDocumentId'),
        notes,
        ...(updating ? { version: parseInteger(record.version, 'version') } : {}),
    }
}
