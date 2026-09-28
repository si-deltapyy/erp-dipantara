import type { Payment, PaymentQuery } from '@/core/types/payment'
import {
    invalidContract,
    parseId,
    parseMoney,
    parseObject,
    parseString,
    requireKeys,
} from './contracts/value-parsers'
import { parsePaymentInput } from './contracts/payment-input'
import { parseMetadata } from './contracts/response-parsers'
import { parseTimestamp } from './contracts/timestamp-parser'
import { parseBuyerQuery } from './buyer-mapper'
import { sumMoney } from '@/core/domain/money-arithmetic'
export function parsePayment(value: unknown): Payment {
    const record = parseObject(value, 'payment')
    const inputKeys = [
        'invoiceId',
        'paymentDate',
        'sourceAccountId',
        'destinationAccountId',
        'cashAmount',
        'withholdingAmount',
        'roundingAdjustment',
        'proofDocumentId',
        'notes',
    ]
    requireKeys(
        record,
        [
            ...inputKeys,
            'id',
            'ownerUserId',
            'purchaseOrderId',
            'purchaseOrderNumber',
            'invoiceNumber',
            'counterpartyName',
            'direction',
            'sourceAccountLabel',
            'destinationAccountLabel',
            'creditAmount',
            'rejectionReason',
            'status',
            'createdAt',
            'updatedAt',
            'version',
            'createdByUserId',
            'submittedByUserId',
            'allowedActions',
        ],
        'payment',
    )
    const input = parsePaymentInput(Object.fromEntries(inputKeys.map((key) => [key, record[key]])))
    const status = record.status
    const direction = record.direction
    if (
        status !== 'draft' &&
        status !== 'submitted' &&
        status !== 'approved' &&
        status !== 'rejected'
    )
        return invalidContract('status')
    if (direction !== 'receivable' && direction !== 'payable') return invalidContract('direction')
    const creditAmount = parseMoney(record.creditAmount, 'creditAmount')
    if (
        sumMoney([input.cashAmount, input.withholdingAmount, input.roundingAdjustment]) !==
        creditAmount
    )
        return invalidContract('creditAmount')
    return {
        ...input,
        ...parseMetadata(record),
        id: parseId(record.id),
        ownerUserId: parseId(record.ownerUserId),
        purchaseOrderId: parseId(record.purchaseOrderId),
        purchaseOrderNumber: parseString(record.purchaseOrderNumber, 'purchaseOrderNumber'),
        invoiceNumber: parseString(record.invoiceNumber, 'invoiceNumber'),
        counterpartyName: parseString(record.counterpartyName, 'counterpartyName'),
        direction,
        sourceAccountLabel: parseString(record.sourceAccountLabel, 'sourceAccountLabel'),
        destinationAccountLabel: parseString(
            record.destinationAccountLabel,
            'destinationAccountLabel',
        ),
        creditAmount,
        rejectionReason:
            record.rejectionReason === null
                ? null
                : parseString(record.rejectionReason, 'rejectionReason'),
        status,
        createdAt: parseTimestamp(record.createdAt, 'createdAt'),
        updatedAt: parseTimestamp(record.updatedAt, 'updatedAt'),
    }
}
export function parsePaymentQuery(query: PaymentQuery): PaymentQuery {
    if (query.status && !['draft', 'submitted', 'approved', 'rejected'].includes(query.status))
        return invalidContract('status')
    if (query.direction && !['receivable', 'payable'].includes(query.direction))
        return invalidContract('direction')
    return {
        ...parseBuyerQuery(query),
        ...(query.invoiceId ? { invoiceId: parseId(query.invoiceId) } : {}),
        ...(query.purchaseOrderId ? { purchaseOrderId: parseId(query.purchaseOrderId) } : {}),
        ...(query.status ? { status: query.status } : {}),
        ...(query.direction ? { direction: query.direction } : {}),
    }
}
