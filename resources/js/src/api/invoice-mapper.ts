import { parseInvoiceTerms } from './contracts/invoice-input'
import { parseDeliveryDate } from './contracts/delivery-input'
import type { Invoice, InvoiceQuery } from '@/core/types/invoice'
import { parseMetadata } from './contracts/response-parsers'
import { parseTimestamp } from './contracts/timestamp-parser'
import { parseBuyerQuery } from './buyer-mapper'
import {
    invalidContract,
    parseObject,
    parseString,
    parseId,
    parseInteger,
    parseMoney,
    requireKeys,
} from './contracts/value-parsers'
function nullable(value: unknown, key: string): string | null {
    return value === null ? null : parseString(value, key)
}
export function parseInvoice(value: unknown): Invoice {
    const record = parseObject(value, 'invoice')
    requireKeys(
        record,
        [
            'id',
            'ownerUserId',
            'purchaseOrderNumber',
            'counterpartyName',
            'purchaseOrderId',
            'mitraId',
            'direction',
            'kind',
            'invoiceDate',
            'terms',
            'notes',
            'status',
            'number',
            'totalAmount',
            'outstandingAmount',
            'revisionNumber',
            'documentId',
            'createdAt',
            'updatedAt',
            'createdByUserId',
            'submittedByUserId',
            'allowedActions',
            'version',
        ],
        'invoice',
    )
    const direction = record.direction
    const kind = record.kind
    const status = record.status
    if (direction !== 'receivable' && direction !== 'payable') return invalidContract('direction')
    if (kind !== 'down_payment' && kind !== 'settlement') return invalidContract('kind')
    if (status !== 'draft' && status !== 'issued' && status !== 'superseded')
        return invalidContract('status')
    const terms = parseInvoiceTerms(record.terms)
    return {
        ...parseMetadata(record),
        id: parseId(record.id),
        ownerUserId: parseId(record.ownerUserId),
        purchaseOrderNumber: parseString(record.purchaseOrderNumber, 'purchaseOrderNumber'),
        counterpartyName: parseString(record.counterpartyName, 'counterpartyName'),
        purchaseOrderId: parseId(record.purchaseOrderId),
        mitraId: record.mitraId === null ? null : parseId(record.mitraId),
        direction,
        kind,
        status,
        terms,
        invoiceDate: parseDeliveryDate(record.invoiceDate, 'invoiceDate'),
        notes: nullable(record.notes, 'notes'),
        number: nullable(record.number, 'number'),
        totalAmount: parseMoney(record.totalAmount, 'totalAmount'),
        outstandingAmount: parseMoney(record.outstandingAmount, 'outstandingAmount'),
        revisionNumber: parseInteger(record.revisionNumber, 'revisionNumber'),
        documentId: record.documentId === null ? null : parseId(record.documentId),
        createdAt: parseTimestamp(record.createdAt, 'createdAt'),
        updatedAt: parseTimestamp(record.updatedAt, 'updatedAt'),
    }
}
export function parseInvoiceQuery(query: InvoiceQuery): InvoiceQuery {
    if (query.direction && query.direction !== 'payable' && query.direction !== 'receivable')
        return invalidContract('direction')
    return {
        ...parseBuyerQuery(query),
        ...(query.purchaseOrderId ? { purchaseOrderId: parseId(query.purchaseOrderId) } : {}),
        ...(query.mitraId ? { mitraId: parseId(query.mitraId) } : {}),
        ...(query.direction ? { direction: query.direction } : {}),
    }
}
