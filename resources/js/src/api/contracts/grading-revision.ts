import type { GradingRevisionInput } from '@/core/types/grading'
import { parseGradingDate, parseGradingRows } from './grading-input'
import {
    invalidContract,
    parseInteger,
    parseObject,
    parseString,
    requireKeys,
} from './value-parsers'
export function parseGradingRevision(value: unknown): GradingRevisionInput {
    const record = parseObject(value, 'revision')
    requireKeys(record, ['version', 'reason', 'gradingDate', 'rows'], 'revision')
    const reason = parseString(record.reason, 'reason').trim()
    if (!reason || [...reason].length > 255) return invalidContract('reason')
    return {
        version: parseInteger(record.version, 'version'),
        reason,
        gradingDate: parseGradingDate(record.gradingDate),
        rows: parseGradingRows(record.rows),
    }
}
