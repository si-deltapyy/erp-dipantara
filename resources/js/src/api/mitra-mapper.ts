import { parseTimestamp } from './contracts/timestamp-parser'
import type { Mitra, MitraInput, MitraUpdate } from '@/core/types/mitra'
import { mitraFieldLimits } from '@/core/domain/mitra-validation'
import { parseMetadata } from './contracts/response-parsers'
import {
    invalidContract,
    parseId,
    parseInteger,
    parseObject,
    parseString,
    requireKeys,
} from './contracts/value-parsers'

export function parseMitraInput(value: unknown, update = false): MitraInput | MitraUpdate {
    const record = parseObject(value, 'mitra')
    requireKeys(record, [...Object.keys(mitraFieldLimits), ...(update ? ['version'] : [])], 'mitra')
    const input = parseMitraFields(record)
    return update ? { ...input, version: parseInteger(record.version, 'version') } : input
}
function parseMitraFields(record: Record<string, unknown>): MitraInput {
    const field = (name: keyof MitraInput): string => {
        const value = parseString(record[name], name)
        if ([...value].length > mitraFieldLimits[name]) return invalidContract(name)
        if (name === 'name' && !value.trim()) return invalidContract(name)
        return name === 'name' ? value.trim() : value
    }
    return {
        name: field('name'),
        phone: field('phone'),
        address: field('address'),
    }
}
export function parseMitra(value: unknown): Mitra {
    const record = parseObject(value, 'mitra')
    requireKeys(
        record,
        [
            ...Object.keys(mitraFieldLimits),
            'id',
            'version',
            'createdAt',
            'updatedAt',
            'createdByUserId',
            'submittedByUserId',
            'allowedActions',
        ],
        'mitra',
    )
    return {
        ...parseMitraFields(record),
        ...parseMetadata(record),
        id: parseId(record.id),
        createdAt: parseTimestamp(record.createdAt, 'createdAt'),
        updatedAt: parseTimestamp(record.updatedAt, 'updatedAt'),
    }
}
export {
    parseMasterLookup as parseMitraLookup,
    parseMasterQuery as parseMitraQuery,
} from './contracts/master-parsers'
