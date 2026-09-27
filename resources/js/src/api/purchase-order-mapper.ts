import type {
    PurchaseOrder,
    PurchaseOrderRejection,
    PurchaseOrderInput,
    PurchaseOrderUpdate,
    PurchaseOrderQuery,
    PurchaseOrderLineInput,
} from '@/core/types/purchase-order'
import { purchaseOrderStatuses } from '@/core/types/purchase-order'
import { parseMetadata } from './contracts/response-parsers'
import { parseTimestamp } from './contracts/timestamp-parser'
import { parseBuyerQuery } from './buyer-mapper'
import {
    invalidContract,
    parseId,
    parseInteger,
    parseMoney,
    parseObject,
    parseString,
    requireKeys,
} from './contracts/value-parsers'

const inputKeys = ['buyerId', 'number', 'orderDate', 'lines', 'notes']
function text(value: unknown, path: string, max = 255): string {
    const result = parseString(value, path)
    if (!result.trim() || [...result].length > max) return invalidContract(path)
    return result
}
function parseDate(value: unknown): string {
    const date = parseString(value, 'orderDate')
    if (
        !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        !Number.isFinite(Date.parse(date)) ||
        new Date(date).toISOString().slice(0, 10) !== date
    )
        return invalidContract('orderDate')
    return date
}
function parseLines(value: unknown, response: boolean): PurchaseOrderLineInput[] {
    if (!Array.isArray(value) || !value.length) return invalidContract('lines')
    return value.map((entry, index) => {
        const path = `lines.${index}`
        const row = parseObject(entry, path)
        requireKeys(
            row,
            [
                'timberProductId',
                'quantity',
                'unitPrice',
                ...(response ? ['timberProductName'] : []),
            ],
            path,
        )
        return {
            timberProductId: parseId(row.timberProductId, `${path}.timberProductId`),
            quantity: parseInteger(row.quantity, `${path}.quantity`),
            unitPrice: parseMoney(row.unitPrice, `${path}.unitPrice`),
            ...(response
                ? {
                      timberProductName: text(
                          row.timberProductName,
                          `${path}.timberProductName`,
                          Number.MAX_SAFE_INTEGER,
                      ),
                  }
                : {}),
        }
    })
}
function fields(record: Record<string, unknown>, response = false): PurchaseOrderInput {
    const notes =
        record.notes === null || (!response && record.notes === undefined)
            ? null
            : parseString(record.notes, 'notes')
    if (notes && [...notes].length > 2000) return invalidContract('notes')
    return {
        buyerId: parseId(record.buyerId, 'buyerId'),
        number: text(record.number, 'number'),
        orderDate: parseDate(record.orderDate),
        lines: parseLines(record.lines, response),
        notes,
    }
}
export function parsePurchaseOrderInput(value: unknown): PurchaseOrderInput {
    const record = parseObject(value, 'purchaseOrder')
    requireKeys(record, inputKeys, 'purchaseOrder')
    return fields(record)
}
export function parsePurchaseOrderUpdate(value: unknown): PurchaseOrderUpdate {
    const record = parseObject(value, 'purchaseOrder')
    requireKeys(record, [...inputKeys, 'version'], 'purchaseOrder')
    return { ...fields(record), version: parseInteger(record.version, 'version') }
}
export function parsePurchaseOrder(value: unknown): PurchaseOrder {
    const record = parseObject(value, 'purchaseOrder')
    requireKeys(
        record,
        [
            ...inputKeys,
            'buyerName',
            'id',
            'version',
            'status',
            'rejectionReason',
            'totalAmount',
            'createdAt',
            'updatedAt',
            'createdByUserId',
            'submittedByUserId',
            'allowedActions',
        ],
        'purchaseOrder',
    )
    const status = purchaseOrderStatuses.find((candidate) => candidate === record.status)
    if (!status) return invalidContract('status')
    const input = fields(record, true)
    return {
        ...input,
        ...parseMetadata(record),
        id: parseId(record.id),
        buyerName: text(record.buyerName, 'buyerName', Number.MAX_SAFE_INTEGER),
        lines: input.lines.map((line, index) => ({
            ...line,
            timberProductName: text(
                parseObject((record.lines as unknown[])[index], 'lines').timberProductName,
                `lines.${index}.timberProductName`,
                Number.MAX_SAFE_INTEGER,
            ),
        })),
        status,
        rejectionReason:
            record.rejectionReason === null
                ? null
                : text(record.rejectionReason, 'rejectionReason', 2000),
        totalAmount: parseMoney(record.totalAmount, 'totalAmount'),
        createdAt: parseTimestamp(record.createdAt, 'createdAt'),
        updatedAt: parseTimestamp(record.updatedAt, 'updatedAt'),
    }
}
export function parsePurchaseOrderQuery(query: PurchaseOrderQuery): PurchaseOrderQuery {
    if (query.status && !purchaseOrderStatuses.includes(query.status))
        return invalidContract('status')
    return {
        ...parseBuyerQuery(query),
        ...(query.buyerId ? { buyerId: parseId(query.buyerId, 'buyerId') } : {}),
        ...(query.status ? { status: query.status } : {}),
    }
}
export function parsePurchaseOrderVersion(value: unknown): { version: number } {
    const record = parseObject(value, 'submit')
    requireKeys(record, ['version'], 'submit')
    return { version: parseInteger(record.version, 'version') }
}

export function parsePurchaseOrderRejection(value: unknown): PurchaseOrderRejection {
    const record = parseObject(value, 'reject')
    requireKeys(record, ['version', 'reason'], 'reject')
    return {
        version: parseInteger(record.version, 'version'),
        reason: text(record.reason, 'reason', 2000).trim(),
    }
}
