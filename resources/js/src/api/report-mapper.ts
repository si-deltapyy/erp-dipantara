import type { ReportQuery } from '@/core/types/report'
import { productionCategories } from '@/core/types/production'
import { parseBuyerQuery } from './buyer-mapper'
import { parseProductionPeriod } from './production-mapper'
import { parseId, invalidContract } from './contracts/value-parsers'
export function parseReportQuery(query: ReportQuery): ReportQuery {
    if (query.category && !productionCategories.includes(query.category))
        return invalidContract('category')
    return {
        ...parseBuyerQuery(query),
        period: parseProductionPeriod(query.period),
        ...(query.buyerId ? { buyerId: parseId(query.buyerId) } : {}),
        ...(query.mitraId ? { mitraId: parseId(query.mitraId) } : {}),
        ...(query.graderId ? { graderId: parseId(query.graderId) } : {}),
        ...(query.timberProductId ? { timberProductId: parseId(query.timberProductId) } : {}),
        ...(query.category ? { category: query.category } : {}),
    }
}
