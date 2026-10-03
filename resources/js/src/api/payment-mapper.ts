import type { Payment, PaymentRecord, PaymentQuery } from '@/core/types/payment'
import {
    invalidContract,
    parseId,
    parseNumericId,
    parseNumericMoney,
    parseMoney,
    parseObject,
    parseString,
    requireKeys,
} from './contracts/value-parsers'
import { parseDeliveryDate } from './contracts/delivery-input'
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

export function parsePaymentRecord(value: unknown): PaymentRecord {
    const payment = parseObject(value, 'payment')
    const preOrder = payment.pre_order === null ? null : parseObject(payment.pre_order, 'pre_order')
    const buyer =
        preOrder === null || preOrder.buyer === null
            ? null
            : parseObject(preOrder.buyer, 'pre_order.buyer')
    const status = payment.payment_status
    if (status !== 'pending' && status !== 'completed' && status !== 'cancelled')
        return invalidContract('payment_status')
    return {
        id: parseNumericId(payment.id),
        purchaseOrderNumber:
            preOrder === null
                ? null
                : parseString(preOrder.pre_order_number, 'pre_order.pre_order_number'),
        buyerName:
            buyer === null ? null : parseString(buyer.company_name, 'pre_order.buyer.company_name'),
        paymentDate: parseDeliveryDate(payment.payment_date, 'payment_date'),
        dueDate: parseDeliveryDate(payment.payment_due_date, 'payment_due_date'),
        amount: parseNumericMoney(payment.payment_amount, 'payment_amount'),
        buyerTerm: parseString(payment.buyer_payment_termin, 'buyer_payment_termin'),
        mitraTerm: parseString(payment.mitra_payment_termin, 'mitra_payment_termin'),
        status,
    }
}
