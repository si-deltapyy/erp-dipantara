import type {
    AvailableTimber,
    AvailabilityQuery,
    Delivery,
    DeliveryRecord,
    DeliveryQuery,
} from '@/core/types/delivery'
import { deliveryStatuses, deliveryRecordStatuses } from '@/core/types/delivery'
import { parseBuyerQuery } from './buyer-mapper'
import { parseMetadata } from './contracts/response-parsers'
import { parseTimestamp } from './contracts/timestamp-parser'
import { parseDeliveryInput, parseDeliveryDate } from './contracts/delivery-input'
import {
    invalidContract,
    parseId,
    parseNumericId,
    parseInteger,
    parseObject,
    parseString,
    requireKeys,
} from './contracts/value-parsers'
export { parseDeliveryInput, parseDeliveryDate } from './contracts/delivery-input'

export function parseDelivery(value: unknown): Delivery {
    const record = parseObject(value, 'delivery')
    requireKeys(
        record,
        [
            'purchaseOrderId',
            'deliveryDate',
            'licensePlate',
            'allocations',
            'documents',
            'id',
            'status',
            'purchaseOrderNumber',
            'ownerUserId',
            'buyerName',
            'allocationContext',
            'version',
            'createdByUserId',
            'submittedByUserId',
            'allowedActions',
            'createdAt',
            'updatedAt',
        ],
        'delivery',
    )
    const status = deliveryStatuses.find((status) => status === record.status)
    if (!status) return invalidContract('status')
    const input = parseDeliveryInput({
        purchaseOrderId: record.purchaseOrderId,
        deliveryDate: record.deliveryDate,
        licensePlate: record.licensePlate,
        allocations: record.allocations,
        documents: record.documents,
        availabilityToken: 'response',
    })
    if (
        !Array.isArray(record.allocationContext) ||
        record.allocationContext.length !== input.allocations.length
    )
        return invalidContract('allocationContext')
    const allocationContext = record.allocationContext.map((entry, index) => {
        const row = parseObject(entry, `allocationContext.${index}`)
        requireKeys(
            row,
            ['gradingId', 'rowId', 'quantity', 'assignmentId', 'mitraName', 'timberProductName'],
            'allocationContext',
        )
        const allocation = input.allocations[index]
        if (
            !allocation ||
            row.gradingId !== allocation.gradingId ||
            row.rowId !== allocation.rowId ||
            row.quantity !== allocation.quantity
        )
            return invalidContract('allocationContext')
        return {
            ...allocation,
            assignmentId: parseId(row.assignmentId),
            mitraName: parseString(row.mitraName, 'mitraName'),
            timberProductName: parseString(row.timberProductName, 'timberProductName'),
        }
    })
    return {
        purchaseOrderId: input.purchaseOrderId,
        deliveryDate: input.deliveryDate,
        licensePlate: input.licensePlate,
        allocations: input.allocations,
        documents: input.documents,
        ...parseMetadata(record),
        id: parseId(record.id),
        status,
        ownerUserId: parseId(record.ownerUserId, 'ownerUserId'),
        purchaseOrderNumber: parseString(record.purchaseOrderNumber, 'purchaseOrderNumber'),
        buyerName: parseString(record.buyerName, 'buyerName'),
        allocationContext,
        createdAt: parseTimestamp(record.createdAt, 'createdAt'),
        updatedAt: parseTimestamp(record.updatedAt, 'updatedAt'),
    }
}
export function parseAvailableTimber(value: unknown): AvailableTimber {
    const row = parseObject(value, 'availability')
    requireKeys(
        row,
        [
            'gradingId',
            'rowId',
            'assignmentId',
            'mitraName',
            'timberProductName',
            'approvedQuantity',
            'reservedQuantity',
            'shippedQuantity',
            'availableQuantity',
            'snapshotToken',
            'lineageIds',
        ],
        'availability',
    )
    if (!Array.isArray(row.lineageIds) || !row.lineageIds.length)
        return invalidContract('lineageIds')
    const lineageIds = row.lineageIds.map((id) => parseId(id, 'lineageIds'))
    if (!lineageIds.includes(parseId(row.gradingId))) return invalidContract('lineageIds')
    const approvedQuantity = parseInteger(row.approvedQuantity, 'approvedQuantity')
    const reservedQuantity = parseInteger(row.reservedQuantity, 'reservedQuantity', 0)
    const shippedQuantity = parseInteger(row.shippedQuantity, 'shippedQuantity', 0)
    const availableQuantity = parseInteger(row.availableQuantity, 'availableQuantity', 0)
    if (availableQuantity + reservedQuantity + shippedQuantity !== approvedQuantity)
        return invalidContract('availableQuantity')
    return {
        gradingId: parseId(row.gradingId),
        rowId: parseId(row.rowId),
        assignmentId: parseId(row.assignmentId),
        mitraName: parseString(row.mitraName, 'mitraName'),
        timberProductName: parseString(row.timberProductName, 'timberProductName'),
        lineageIds,
        approvedQuantity,
        reservedQuantity,
        shippedQuantity,
        availableQuantity,
        snapshotToken: parseId(row.snapshotToken),
    }
}
export function parseDeliveryQuery(query: DeliveryQuery): DeliveryQuery {
    if (query.status && !deliveryStatuses.includes(query.status)) return invalidContract('status')
    return {
        ...parseBuyerQuery(query),
        ...(query.purchaseOrderId ? { purchaseOrderId: parseId(query.purchaseOrderId) } : {}),
        ...(query.assignmentId ? { assignmentId: parseId(query.assignmentId) } : {}),
        ...(query.status ? { status: query.status } : {}),
    }
}
export function parseAvailabilityQuery(query: AvailabilityQuery): AvailabilityQuery {
    return {
        ...parseBuyerQuery(query),
        purchaseOrderId: parseId(query.purchaseOrderId, 'purchaseOrderId'),
        ...(query.assignmentId ? { assignmentId: parseId(query.assignmentId) } : {}),
        ...(query.excludeDeliveryId ? { excludeDeliveryId: parseId(query.excludeDeliveryId) } : {}),
    }
}

export function parseDeliveryRecord(value: unknown): DeliveryRecord {
    const delivery = parseObject(value, 'delivery')
    const preOrder =
        delivery.pre_order === null ? null : parseObject(delivery.pre_order, 'pre_order')
    const mitra = delivery.mitra === null ? null : parseObject(delivery.mitra, 'mitra')
    const status = deliveryRecordStatuses.find((status) => status === delivery.delivery_status)
    if (!status) return invalidContract('delivery_status')
    return {
        id: parseNumericId(delivery.id),
        purchaseOrderNumber:
            preOrder === null
                ? null
                : parseString(preOrder.pre_order_number, 'pre_order.pre_order_number'),
        mitraName: mitra === null ? null : parseString(mitra.name, 'mitra.name'),
        deliveryDate: parseDeliveryDate(delivery.delivery_date),
        licensePlate: parseString(delivery.car_plate_number, 'car_plate_number'),
        status,
        buyerSakrNumber: parseString(delivery.SAKR_number_to_buyer, 'SAKR_number_to_buyer'),
        companySakrNumber: parseString(delivery.SAKR_number_to_company, 'SAKR_number_to_company'),
    }
}
