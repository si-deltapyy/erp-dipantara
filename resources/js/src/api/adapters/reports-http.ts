import { parsePurchasePriceRow } from '@/api/purchase-price-mapper'
import type { AxiosInstance } from 'axios'
import type { ReportsApi } from '@/core/types/report'
import { createHttpClient } from '@/services/http-client'
import { parsePage } from '@/api/contracts/response-parsers'
import { invalidContract } from '@/api/contracts/value-parsers'
import { parseProductionRow } from '@/api/production-mapper'
import { parseReportQuery } from '@/api/report-mapper'
export function createHttpReports(client: AxiosInstance = createHttpClient()): ReportsApi {
    return {
        async purchasePrices(query, signal) {
            const response = await client.get<unknown>('/api/v1/reports/purchase-prices', {
                params: parseReportQuery(query),
                signal,
            })
            const page = parsePage(response.data, parsePurchasePriceRow)
            if (page.data.some((row) => row.period !== query.period))
                return invalidContract('period')
            return page
        },
        async production(query, signal) {
            const response = await client.get<unknown>('/api/v1/reports/production', {
                params: parseReportQuery(query),
                signal,
            })
            const page = parsePage(response.data, parseProductionRow)
            if (page.data.some((row) => row.period !== query.period))
                return invalidContract('period')
            return page
        },
        subscribe: () => () => undefined,
    }
}
