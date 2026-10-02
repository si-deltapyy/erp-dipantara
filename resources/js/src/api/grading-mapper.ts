import type { Grading, GradingQuery } from '@/core/types/grading'
import { gradingStatuses } from '@/core/types/grading'
import { parseMetadata } from './contracts/response-parsers'
import { parseTimestamp } from './contracts/timestamp-parser'
import { parseBuyerQuery } from './buyer-mapper'
import { parseGradingInput } from './contracts/grading-input'
import {
    invalidContract,
    parseId,
    parseDecimal,
    parseObject,
    parseString,
    requireKeys,
} from './contracts/value-parsers'
export { parseGradingInput } from './contracts/grading-input'
export function parseGrading(value: unknown): Grading {
    const record = parseObject(value, 'grading')
    requireKeys(
        record,
        [
            'assignmentId',
            'gradingDate',
            'rows',
            'id',
            'version',
            'status',
            'purchaseOrderNumber',
            'mitraName',
            'graderName',
            'rejectionReason',
            'revisionReason',
            'revisionOfId',
            'invoiceRevisionRequired',
            'totalVolumeM3',
            'rowResults',
            'createdAt',
            'updatedAt',
            'createdByUserId',
            'submittedByUserId',
            'allowedActions',
        ],
        'grading',
    )
    const status = gradingStatuses.find((status) => status === record.status)
    if (!status || typeof record.invoiceRevisionRequired !== 'boolean')
        return invalidContract('grading')
    const input = parseGradingInput({
        assignmentId: record.assignmentId,
        gradingDate: record.gradingDate,
        rows: record.rows,
    })
    if (!Array.isArray(record.rowResults)) return invalidContract('rowResults')
    const rowResults = record.rowResults.map((entry, index) => {
        const path = `rowResults.${index}`
        const result = parseObject(entry, path)
        requireKeys(result, ['rowId', 'volumeM3', 'timberProductName'], path)
        return {
            rowId: parseId(result.rowId, path),
            volumeM3: parseDecimal(result.volumeM3, path),
            timberProductName: parseString(result.timberProductName, path),
        }
    })
    if (
        rowResults.length !== input.rows.length ||
        new Set(rowResults.map((row) => row.rowId)).size !== rowResults.length ||
        input.rows.some((row) => !rowResults.some((result) => result.rowId === row.rowId))
    )
        return invalidContract('rowResults')
    return {
        ...input,
        ...parseMetadata(record),
        id: parseId(record.id),
        status,
        purchaseOrderNumber: parseString(record.purchaseOrderNumber, 'purchaseOrderNumber'),
        mitraName: parseString(record.mitraName, 'mitraName'),
        graderName: parseString(record.graderName, 'graderName'),
        totalVolumeM3: parseDecimal(record.totalVolumeM3),
        rowResults,
        revisionOfId: nullable(record.revisionOfId, 'revisionOfId'),
        rejectionReason: nullable(record.rejectionReason, 'rejectionReason'),
        revisionReason: nullable(record.revisionReason, 'revisionReason'),
        invoiceRevisionRequired: record.invoiceRevisionRequired,
        createdAt: parseTimestamp(record.createdAt, 'createdAt'),
        updatedAt: parseTimestamp(record.updatedAt, 'updatedAt'),
    }
}
function nullable(value: unknown, field: string): string | null {
    return value === null ? null : parseString(value, field)
}
export function parseGradingQuery(query: GradingQuery): GradingQuery {
    if (query.status && !gradingStatuses.includes(query.status)) return invalidContract('status')
    return {
        ...parseBuyerQuery(query),
        ...(query.status ? { status: query.status } : {}),
        ...(query.assignmentId ? { assignmentId: parseId(query.assignmentId) } : {}),
    }
}
