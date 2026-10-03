import type { Order, OrderRecord, OrderInput, OrderQuery } from '@/core/types/order'
import { orderStatuses } from '@/core/types/order'
import { parseMetadata } from './contracts/response-parsers'
import { parseTimestamp } from './contracts/timestamp-parser'
import { parseBuyerQuery } from './buyer-mapper'
import {
    invalidContract,
    parseId,
    parseNumericId,
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

export function parseOrderRecord(value: unknown): OrderRecord {
    const order = parseObject(value, 'order')
    const preOrder = order.pre_order === null ? null : parseObject(order.pre_order, 'pre_order')
    const buyer =
        preOrder === null || preOrder.buyer === null
            ? null
            : parseObject(preOrder.buyer, 'pre_order.buyer')
    const mitra = order.mitra === null ? null : parseObject(order.mitra, 'mitra')
    const grader = order.grader === null ? null : parseObject(order.grader, 'grader')
    const user =
        grader === null || grader.user === null ? null : parseObject(grader.user, 'grader.user')
    return {
        id: parseNumericId(order.id),
        number: parseString(order.order_number, 'order_number'),
        orderDate: parseString(order.order_date, 'order_date'),
        purchaseOrderNumber:
            preOrder === null
                ? null
                : parseString(preOrder.pre_order_number, 'pre_order.pre_order_number'),
        buyerName:
            buyer === null ? null : parseString(buyer.company_name, 'pre_order.buyer.company_name'),
        mitraName: mitra === null ? null : parseString(mitra.name, 'mitra.name'),
        graderName: user === null ? null : parseString(user.name, 'grader.user.name'),
        buyerGraderName: parseString(order.grader_buyer_name, 'grader_buyer_name'),
        notes: order.note === null ? null : parseString(order.note, 'note'),
    }
}
