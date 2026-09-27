import type { Order, OrderInput, OrderQuery } from '@/core/types/order'
import { orderStatuses } from '@/core/types/order'
import { parseMetadata } from './contracts/response-parsers'
import { parseTimestamp } from './contracts/timestamp-parser'
import { parseBuyerQuery } from './buyer-mapper'
import {
    invalidContract,
    parseId,
    parseInteger,
    parseObject,
    parseString,
    requireKeys,
} from './contracts/value-parsers'
export function parseOrderInput(
    value: unknown,
    updating = false,
): OrderInput & { version?: number } {
    const record = parseObject(value, 'order')
    requireKeys(record, ['purchaseOrderId', 'notes', ...(updating ? ['version'] : [])], 'order')
    const notes =
        record.notes === null || record.notes === undefined
            ? null
            : parseString(record.notes, 'notes')
    if (notes && [...notes].length > 2000) return invalidContract('notes')
    return {
        purchaseOrderId: parseId(record.purchaseOrderId, 'purchaseOrderId'),
        notes,
        ...(updating ? { version: parseInteger(record.version, 'version') } : {}),
    }
}
export function parseOrder(value: unknown): Order {
    const record = parseObject(value, 'order')
    requireKeys(
        record,
        [
            'purchaseOrderId',
            'notes',
            'id',
            'version',
            'status',
            'purchaseOrderNumber',
            'buyerName',
            'rejectionReason',
            'createdAt',
            'updatedAt',
            'createdByUserId',
            'submittedByUserId',
            'allowedActions',
        ],
        'order',
    )
    const status = orderStatuses.find((status) => status === record.status)
    if (!status) return invalidContract('status')
    const input = parseOrderInput({ purchaseOrderId: record.purchaseOrderId, notes: record.notes })
    return {
        ...input,
        ...parseMetadata(record),
        id: parseId(record.id),
        status,
        purchaseOrderNumber: parseString(record.purchaseOrderNumber, 'purchaseOrderNumber'),
        buyerName: parseString(record.buyerName, 'buyerName'),
        rejectionReason:
            record.rejectionReason === null
                ? null
                : parseString(record.rejectionReason, 'rejectionReason'),
        createdAt: parseTimestamp(record.createdAt, 'createdAt'),
        updatedAt: parseTimestamp(record.updatedAt, 'updatedAt'),
    }
}
export function parseOrderQuery(query: OrderQuery): OrderQuery {
    if (query.status && !orderStatuses.includes(query.status)) return invalidContract('status')
    return {
        ...parseBuyerQuery(query),
        ...(query.status ? { status: query.status } : {}),
        ...(query.purchaseOrderId ? { purchaseOrderId: parseId(query.purchaseOrderId) } : {}),
    }
}
