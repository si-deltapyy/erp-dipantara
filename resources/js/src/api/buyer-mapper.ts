import { parseTimestamp } from './contracts/timestamp-parser'
import type { Buyer, BuyerInput, BuyerLookup, BuyerQuery, BuyerUpdate } from '@/core/types/buyer'
import { buyerFieldLimits } from '@/core/domain/buyer-validation'
import { parseMetadata } from './contracts/response-parsers'
import {
    invalidContract,
    parseId,
    parseInteger,
    parseObject,
    parseString,
    requireKeys,
} from './contracts/value-parsers'

export function parseBuyerInput(value: unknown, update = false): BuyerInput | BuyerUpdate {
    const record = parseObject(value, 'buyer')
    requireKeys(record, [...Object.keys(buyerFieldLimits), ...(update ? ['version'] : [])], 'buyer')
    const input = parseBuyerFields(record)
    return update ? { ...input, version: parseInteger(record.version, 'version') } : input
}
function parseBuyerFields(record: Record<string, unknown>): BuyerInput {
    const field = (name: keyof BuyerInput): string => {
        const value = parseString(record[name], name)
        if ([...value].length > buyerFieldLimits[name]) return invalidContract(name)
        if ((name === 'companyName' || name === 'contactName') && !value.trim())
            return invalidContract(name)
        return name === 'companyName' || name === 'contactName' ? value.trim() : value
    }
    return {
        companyName: field('companyName'),
        contactName: field('contactName'),
        phone: field('phone'),
        address: field('address'),
    }
}
export function parseBuyer(value: unknown): Buyer {
    const record = parseObject(value, 'buyer')
    requireKeys(
        record,
        [
            ...Object.keys(buyerFieldLimits),
            'id',
            'version',
            'createdAt',
            'updatedAt',
            'createdByUserId',
            'submittedByUserId',
            'allowedActions',
        ],
        'buyer',
    )
    return {
        ...parseBuyerFields(record),
        ...parseMetadata(record),
        id: parseId(record.id),
        createdAt: parseTimestamp(record.createdAt, 'createdAt'),
        updatedAt: parseTimestamp(record.updatedAt, 'updatedAt'),
    }
}
export function parseBuyerLookup(value: unknown): BuyerLookup {
    const record = parseObject(value, 'lookup')
    requireKeys(record, ['id', 'label'], 'lookup')
    return { id: parseId(record.id), label: parseString(record.label, 'label') }
}
export function parseBuyerQuery(query: BuyerQuery): BuyerQuery {
    const search = parseString(query.search, 'search')
    if ([...search].length > 200) return invalidContract('search')
    if (!['createdAt', '-createdAt'].includes(query.sort)) return invalidContract('sort')
    return {
        page: parseInteger(query.page, 'page'),
        perPage: parseInteger(query.perPage, 'perPage', 1, 100),
        search,
        sort: query.sort,
    }
}
