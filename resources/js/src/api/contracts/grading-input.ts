import type { GradingInput, GradingRow } from '@/core/types/grading'
import { isTimberDimension, canonicalDecimal } from '@/core/domain/timber-measurements'
import {
    invalidContract,
    parseId,
    parseInteger,
    parseObject,
    parseString,
    requireKeys,
} from './value-parsers'
export function parseGradingDate(value: unknown): string {
    const date = parseString(value, 'gradingDate')
    if (
        !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        !Number.isFinite(Date.parse(date)) ||
        new Date(date).toISOString().slice(0, 10) !== date
    )
        return invalidContract('gradingDate')
    return date
}
export function parseGradingRows(value: unknown): readonly GradingRow[] {
    if (!Array.isArray(value) || !value.length) return invalidContract('rows')
    const ids = new Set<string>()
    return value.map((entry, index) => {
        const path = `rows.${index}`
        const row = parseObject(entry, path)
        requireKeys(
            row,
            ['rowId', 'timberProductId', 'quantity', 'diameterCm', 'lengthM', 'gradeCode'],
            path,
        )
        const rowId = parseId(row.rowId, `${path}.rowId`)
        if (ids.has(rowId)) return invalidContract(`${path}.rowId`)
        ids.add(rowId)
        const gradeCode = parseString(row.gradeCode, `${path}.gradeCode`).trim()
        if (!gradeCode || gradeCode.length > 255) return invalidContract(`${path}.gradeCode`)
        return {
            rowId,
            timberProductId: parseId(row.timberProductId, `${path}.timberProductId`),
            quantity: parseInteger(row.quantity, `${path}.quantity`),
            diameterCm: dimension(row.diameterCm, `${path}.diameterCm`),
            lengthM: dimension(row.lengthM, `${path}.lengthM`),
            gradeCode,
        }
    })
}
function dimension(value: unknown, path: string): string {
    const decimal = parseString(value, path)
    if (!isTimberDimension(decimal)) return invalidContract(path)
    return canonicalDecimal(decimal, 2)
}
export function parseGradingInput(
    value: unknown,
    updating = false,
): GradingInput & { version?: number } {
    const record = parseObject(value, 'grading')
    requireKeys(
        record,
        ['assignmentId', 'gradingDate', 'rows', ...(updating ? ['version'] : [])],
        'grading',
    )
    return {
        assignmentId: parseId(record.assignmentId, 'assignmentId'),
        gradingDate: parseGradingDate(record.gradingDate),
        rows: parseGradingRows(record.rows),
        ...(updating ? { version: parseInteger(record.version, 'version') } : {}),
    }
}
