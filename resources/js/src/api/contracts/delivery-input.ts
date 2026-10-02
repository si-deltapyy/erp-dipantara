import type { DeliveryAllocation, DeliveryDocument, DeliveryInput } from '@/core/types/delivery'
import {
    invalidContract,
    parseId,
    parseInteger,
    parseObject,
    parseString,
    requireKeys,
} from './value-parsers'

export function parseDeliveryDate(value: unknown, path = 'deliveryDate'): string {
    const date = parseString(value, path)
    if (
        !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        !Number.isFinite(Date.parse(date)) ||
        new Date(date).toISOString().slice(0, 10) !== date
    )
        return invalidContract(path)
    return date
}
export function parseAllocations(value: unknown): readonly DeliveryAllocation[] {
    if (!Array.isArray(value) || !value.length) return invalidContract('allocations')
    const identities = new Set<string>()
    return value.map((entry, index) => {
        const path = `allocations.${index}`
        const row = parseObject(entry, path)
        requireKeys(row, ['gradingId', 'rowId', 'quantity'], path)
        const gradingId = parseId(row.gradingId, `${path}.gradingId`)
        const rowId = parseId(row.rowId, `${path}.rowId`)
        const identity = JSON.stringify([gradingId, rowId])
        if (identities.has(identity)) return invalidContract(path)
        identities.add(identity)
        return { gradingId, rowId, quantity: parseInteger(row.quantity, `${path}.quantity`) }
    })
}
export function parseDeliveryDocuments(value: unknown): readonly DeliveryDocument[] {
    if (!Array.isArray(value) || value.length > 2) return invalidContract('documents')
    const directions = new Set<string>()
    return value.map((entry, index) => {
        const path = `documents.${index}`
        const document = parseObject(entry, path)
        requireKeys(document, ['documentId', 'direction', 'number', 'documentDate'], path)
        const direction = document.direction
        if (direction !== 'farmer_to_company' && direction !== 'company_to_buyer')
            return invalidContract(`${path}.direction`)
        if (directions.has(direction)) return invalidContract(`${path}.direction`)
        directions.add(direction)
        const number = parseString(document.number, `${path}.number`).trim()
        if (!number || number.length > 255) return invalidContract(`${path}.number`)
        return {
            documentId: parseId(document.documentId, `${path}.documentId`),
            direction,
            number,
            documentDate: parseDeliveryDate(document.documentDate, `${path}.documentDate`),
        }
    })
}
export function parseDeliveryInput(
    value: unknown,
    updating = false,
): DeliveryInput & { version?: number } {
    const record = parseObject(value, 'delivery')
    requireKeys(
        record,
        [
            'purchaseOrderId',
            'deliveryDate',
            'licensePlate',
            'allocations',
            'documents',
            'availabilityToken',
            ...(updating ? ['version'] : []),
        ],
        'delivery',
    )
    const licensePlate = parseString(record.licensePlate, 'licensePlate').trim()
    if (!licensePlate || licensePlate.length > 20) return invalidContract('licensePlate')
    return {
        purchaseOrderId: parseId(record.purchaseOrderId, 'purchaseOrderId'),
        deliveryDate: parseDeliveryDate(record.deliveryDate),
        licensePlate,
        allocations: parseAllocations(record.allocations),
        documents: parseDeliveryDocuments(record.documents),
        availabilityToken: parseId(record.availabilityToken, 'availabilityToken'),
        ...(updating ? { version: parseInteger(record.version, 'version') } : {}),
    }
}
