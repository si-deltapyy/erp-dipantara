import type { Closing } from '@/core/types/closing'
import { parseMetadata } from './contracts/response-parsers'
import { parseTimestamp } from './contracts/timestamp-parser'
import {
    parseObject,
    requireKeys,
    parseId,
    parseString,
    parseInteger,
    invalidContract,
} from './contracts/value-parsers'
const keys = [
    'id',
    'purchaseOrderId',
    'purchaseOrderNumber',
    'ownerUserId',
    'purchaseOrderVersion',
    'eligibilityToken',
    'notes',
    'rejectionReason',
    'status',
    'createdAt',
    'updatedAt',
    'version',
    'createdByUserId',
    'submittedByUserId',
    'allowedActions',
]
export function parseClosing(value: unknown): Closing {
    const record = parseObject(value, 'closing')
    requireKeys(record, keys, 'closing')
    const status = record.status
    if (status !== 'requested' && status !== 'approved' && status !== 'rejected')
        return invalidContract('status')
    const metadata = parseMetadata(record)
    if (
        metadata.allowedActions.some((action) => !['approve', 'reject'].includes(action)) ||
        (status !== 'requested' && metadata.allowedActions.length)
    )
        return invalidContract('allowedActions')
    const rejectionReason =
        record.rejectionReason === null
            ? null
            : parseString(record.rejectionReason, 'rejectionReason')
    if ((status === 'rejected') !== !!rejectionReason) return invalidContract('rejectionReason')
    const notes = record.notes === null ? null : parseString(record.notes, 'notes')
    if (
        (notes && [...notes].length > 2000) ||
        (rejectionReason && [...rejectionReason].length > 2000)
    )
        return invalidContract('notes')
    return {
        ...metadata,
        status,
        rejectionReason,
        notes,
        id: parseId(record.id),
        purchaseOrderId: parseId(record.purchaseOrderId),
        ownerUserId: parseId(record.ownerUserId),
        purchaseOrderNumber: parseString(record.purchaseOrderNumber, 'purchaseOrderNumber'),
        purchaseOrderVersion: parseInteger(record.purchaseOrderVersion, 'purchaseOrderVersion'),
        eligibilityToken: parseString(record.eligibilityToken, 'eligibilityToken'),
        createdAt: parseTimestamp(record.createdAt, 'createdAt'),
        updatedAt: parseTimestamp(record.updatedAt, 'updatedAt'),
    }
}
