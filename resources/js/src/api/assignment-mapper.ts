import type { Assignment, AssignmentInput, AssignmentQuery } from '@/core/types/assignment'
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
    parseStrings,
    requireKeys,
} from './contracts/value-parsers'
const inputKeys = ['orderId', 'mitraId', 'graderId', 'timberProductId', 'quantity']
function fields(record: Record<string, unknown>): AssignmentInput {
    return {
        orderId: parseId(record.orderId, 'orderId'),
        mitraId: parseId(record.mitraId, 'mitraId'),
        graderId: parseId(record.graderId, 'graderId'),
        timberProductId: parseId(record.timberProductId, 'timberProductId'),
        quantity: parseInteger(record.quantity, 'quantity'),
    }
}
export function parseAssignmentInput(
    value: unknown,
    updating = false,
): AssignmentInput & { version?: number } {
    const record = parseObject(value, 'assignment')
    requireKeys(record, [...inputKeys, ...(updating ? ['version'] : [])], 'assignment')
    return {
        ...fields(record),
        ...(updating ? { version: parseInteger(record.version, 'version') } : {}),
    }
}
export function parseAssignment(value: unknown): Assignment {
    const record = parseObject(value, 'assignment')
    requireKeys(
        record,
        [
            ...inputKeys,
            'id',
            'version',
            'createdAt',
            'updatedAt',
            'createdByUserId',
            'submittedByUserId',
            'allowedActions',
            'graderUserId',
            'purchaseOrderNumber',
            'mitraName',
            'graderName',
            'timberProductName',
            'orderStatus',
            'gradingReference',
        ],
        'assignment',
    )
    const orderStatus = orderStatuses.find((status) => status === record.orderStatus)
    if (!orderStatus) return invalidContract('orderStatus')
    const reference = parseObject(record.gradingReference, 'gradingReference')
    requireKeys(
        reference,
        ['timberProductId', 'timberProductName', 'gradeCodes'],
        'gradingReference',
    )
    return {
        ...fields(record),
        ...parseMetadata(record),
        id: parseId(record.id),
        orderStatus,
        graderUserId: parseId(record.graderUserId),
        purchaseOrderNumber: parseString(record.purchaseOrderNumber, 'purchaseOrderNumber'),
        mitraName: parseString(record.mitraName, 'mitraName'),
        graderName: parseString(record.graderName, 'graderName'),
        timberProductName: parseString(record.timberProductName, 'timberProductName'),
        gradingReference: {
            timberProductId: parseId(reference.timberProductId),
            timberProductName: parseString(reference.timberProductName, 'timberProductName'),
            gradeCodes: parseStrings(reference.gradeCodes, 'gradeCodes'),
        },
        createdAt: parseTimestamp(record.createdAt, 'createdAt'),
        updatedAt: parseTimestamp(record.updatedAt, 'updatedAt'),
    }
}
export function parseAssignmentQuery(query: AssignmentQuery): AssignmentQuery {
    return {
        ...parseBuyerQuery(query),
        ...(query.orderId ? { orderId: parseId(query.orderId) } : {}),
        ...(query.mitraId ? { mitraId: parseId(query.mitraId) } : {}),
        ...(query.graderId ? { graderId: parseId(query.graderId) } : {}),
    }
}
