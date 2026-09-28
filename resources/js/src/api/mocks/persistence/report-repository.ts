import type { ReportQuery } from '@/core/types/report'
import type { ProductionRow } from '@/core/types/production'
import type { PageResponse } from '@/core/types/contracts'
import type { SessionUser } from '@/core/types/session'
import type { DatabaseOptions } from './database'
import { parseReportQuery } from '@/api/report-mapper'
import { reportStores, requireReportActor, productionReportRows } from './report-projection'
import { requireDataset } from './demo-repository'
import { runDemoTransaction } from './transaction'
export class ReportRepository {
    constructor(private readonly options: DatabaseOptions = {}) {}
    async production(
        user: SessionUser | null,
        query: ReportQuery,
        signal: AbortSignal,
    ): Promise<PageResponse<ProductionRow>> {
        const actor = requireReportActor(user)
        const filter = parseReportQuery(query)
        return runDemoTransaction(
            this.options,
            reportStores,
            'readonly',
            async (transaction) => {
                await requireDataset(transaction)
                const rows = await productionReportRows(transaction, actor, filter)
                return {
                    data: rows.slice(
                        (filter.page - 1) * filter.perPage,
                        filter.page * filter.perPage,
                    ),
                    meta: { page: filter.page, perPage: filter.perPage, total: rows.length },
                }
            },
            signal,
        )
    }
}
