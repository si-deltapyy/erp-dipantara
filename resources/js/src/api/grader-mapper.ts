import type {
    Grader,
    GraderInput,
    GraderUpdate,
    GraderProvisionInput,
    GraderProvisioningStatus,
} from '@/core/types/grader'
import {
    graderFieldLimits,
    normalizeGraderEmail,
    validateGrader,
} from '@/core/domain/grader-validation'
import { ApiError } from '@/core/types/api-error'
import { parseMetadata } from './contracts/response-parsers'
import { parseTimestamp } from './contracts/timestamp-parser'
import {
    invalidContract,
    parseId,
    parseInteger,
    parseObject,
    parseString,
    requireKeys,
} from './contracts/value-parsers'

function parseFields(record: Record<string, unknown>): GraderInput {
    const input = {
        name: parseString(record.name, 'name').trim(),
        email: normalizeGraderEmail(parseString(record.email, 'email')),
        phone: parseString(record.phone, 'phone'),
        address: parseString(record.address, 'address'),
    }
    const errors = validateGrader(input)
    if (Object.keys(errors).length)
        throw new ApiError(
            'validation',
            Object.fromEntries(Object.entries(errors).map(([field, error]) => [field, [error]])),
        )
    return input
}
export function parseGraderInput(value: unknown, update = false): GraderInput | GraderUpdate {
    const record = parseObject(value, 'grader')
    requireKeys(
        record,
        [...Object.keys(graderFieldLimits), ...(update ? ['version'] : [])],
        'grader',
    )
    const input = parseFields(record)
    return update ? { ...input, version: parseInteger(record.version, 'version') } : input
}
export function parseGraderProvision(value: unknown): GraderProvisionInput {
    const record = parseObject(value, 'provision')
    requireKeys(record, ['version'], 'provision')
    return { version: parseInteger(record.version, 'version') }
}
function parseStatus(value: unknown): GraderProvisioningStatus {
    if (value === 'not_provisioned' || value === 'pending_activation' || value === 'active')
        return value
    return invalidContract('provisioningStatus')
}
export function parseGrader(value: unknown): Grader {
    const record = parseObject(value, 'grader')
    requireKeys(
        record,
        [
            ...Object.keys(graderFieldLimits),
            'id',
            'version',
            'createdAt',
            'updatedAt',
            'createdByUserId',
            'submittedByUserId',
            'allowedActions',
            'userId',
            'provisioningStatus',
        ],
        'grader',
    )
    const id = parseId(record.id)
    const provisioningStatus = parseStatus(record.provisioningStatus)
    const userId = record.userId === null ? null : parseId(record.userId, 'userId')
    if (
        userId === id ||
        (provisioningStatus === 'active' && !userId) ||
        (provisioningStatus === 'not_provisioned' && userId !== null)
    )
        return invalidContract('userId')
    return {
        ...parseFields(record),
        ...parseMetadata(record),
        id,
        userId,
        provisioningStatus,
        createdAt: parseTimestamp(record.createdAt, 'createdAt'),
        updatedAt: parseTimestamp(record.updatedAt, 'updatedAt'),
    }
}
export {
    parseMasterLookup as parseGraderLookup,
    parseMasterQuery as parseGraderQuery,
} from './contracts/master-parsers'
