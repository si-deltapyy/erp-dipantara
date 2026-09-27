import type { MasterListQuery } from '@/core/types/master-list'
import type { OpaqueId } from '@/core/types/contracts'
import {
    invalidContract,
    parseId,
    parseInteger,
    parseObject,
    parseString,
    requireKeys,
} from './value-parsers'
interface MasterLookup {
    readonly id: OpaqueId
    readonly label: string
}
export function parseMasterLookup(value: unknown): MasterLookup {
    const record = parseObject(value, 'lookup')
    requireKeys(record, ['id', 'label'], 'lookup')
    return { id: parseId(record.id), label: parseString(record.label, 'label') }
}
export function parseMasterQuery(query: MasterListQuery): MasterListQuery {
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
