import type { LocationQuery } from 'vue-router'
import type { ReportQuery } from '@/core/types/report'
import { parseReportQuery } from '@/api/report-mapper'
export function reportRouteQuery(
    query: LocationQuery,
): Omit<ReportQuery, 'page' | 'perPage' | 'search' | 'sort'> {
    const period =
        typeof query.period === 'string'
            ? query.period
            : new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' }).slice(0, 7)
    const fields = Object.fromEntries(
        ['buyerId', 'mitraId', 'graderId', 'timberProductId', 'category'].map((key) => [
            key,
            typeof query[key] === 'string' ? query[key] : undefined,
        ]),
    )
    return { period, ...fields }
}
export function validatedReportRoute(query: LocationQuery): ReportQuery {
    return parseReportQuery({
        ...reportRouteQuery(query),
        page: 1,
        perPage: 20,
        search: typeof query.search === 'string' ? query.search : '',
        sort: '-createdAt',
    })
}
