import type { ReportExportInput } from '@/core/types/report-export'
import type { ReportQuery } from '@/core/types/report'
import { parseObject, requireKeys, invalidContract } from './contracts/value-parsers'
import { parseReportQuery } from './report-mapper'
export function parseReportExport(input: ReportExportInput): ReportExportInput {
    const record = parseObject(input, 'export')
    requireKeys(record, ['kind', 'period', 'format', 'filters'], 'export')
    if (!['production', 'purchase_prices'].includes(input.kind) || input.format !== 'csv')
        return invalidContract('kind')
    const filters = parseObject(input.filters, 'filters')
    requireKeys(
        filters,
        ['buyerId', 'mitraId', 'graderId', 'timberProductId', 'category', 'search', 'sort'],
        'filters',
    )
    const query = exportReportQuery(input)
    return {
        kind: input.kind,
        period: query.period,
        format: 'csv',
        filters: {
            search: query.search,
            sort: query.sort,
            ...(query.buyerId ? { buyerId: query.buyerId } : {}),
            ...(query.mitraId ? { mitraId: query.mitraId } : {}),
            ...(query.graderId ? { graderId: query.graderId } : {}),
            ...(query.timberProductId ? { timberProductId: query.timberProductId } : {}),
            ...(query.category ? { category: query.category } : {}),
        },
    }
}
export function exportReportQuery(input: ReportExportInput): ReportQuery {
    return parseReportQuery({
        ...input.filters,
        period: input.period,
        page: 1,
        perPage: 100,
        search: input.filters.search ?? '',
        sort: input.filters.sort ?? '-createdAt',
    })
}
