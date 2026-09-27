import type { WorkflowVersion, WorkflowRejection } from '@/core/types/workflow'
import {
    parseObject,
    requireKeys,
    parseInteger,
    parseString,
    invalidContract,
} from './value-parsers'
export function parseWorkflowVersion(value: unknown): WorkflowVersion {
    const record = parseObject(value, 'action')
    requireKeys(record, ['version'], 'action')
    return { version: parseInteger(record.version, 'version') }
}
export function parseWorkflowRejection(value: unknown): WorkflowRejection {
    const record = parseObject(value, 'reject')
    requireKeys(record, ['version', 'reason'], 'reject')
    const reason = parseString(record.reason, 'reason').trim()
    if (!reason || [...reason].length > 2000) return invalidContract('reason')
    return { version: parseInteger(record.version, 'version'), reason }
}
