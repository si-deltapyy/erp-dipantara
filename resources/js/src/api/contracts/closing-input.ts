import type { ClosingInput, ClosingQuery } from '@/core/types/closing'
import { closingStatuses } from '@/core/types/closing'
import {
    parseObject,
    requireKeys,
    parseId,
    parseString,
    parseInteger,
    invalidContract,
} from './value-parsers'
import { parseBuyerQuery } from '../buyer-mapper'
export function parseClosingInput(value: unknown): ClosingInput {
    const record = parseObject(value, 'closing')
    requireKeys(record, ['purchaseOrderId', 'version', 'snapshotToken', 'notes'], 'closing')
    const notes = record.notes == null ? null : parseString(record.notes, 'notes').trim() || null
    const snapshotToken = parseString(record.snapshotToken, 'snapshotToken')
    if (!snapshotToken || snapshotToken.length > 255) return invalidContract('snapshotToken')
    if (notes && [...notes].length > 2000) return invalidContract('notes')
    return {
        purchaseOrderId: parseId(record.purchaseOrderId),
        version: parseInteger(record.version, 'version'),
        snapshotToken,
        notes,
    }
}
export function parseClosingQuery(query: ClosingQuery): ClosingQuery {
    if (query.status && !closingStatuses.includes(query.status)) return invalidContract('status')
    return {
        ...parseBuyerQuery(query),
        ...(query.purchaseOrderId ? { purchaseOrderId: parseId(query.purchaseOrderId) } : {}),
        ...(query.status ? { status: query.status } : {}),
    }
}
