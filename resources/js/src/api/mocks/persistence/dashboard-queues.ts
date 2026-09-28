import type { SessionUser } from '@/core/types/session'
import type { PageResponse } from '@/core/types/contracts'
import type {
    DashboardQueueEntry,
    DashboardQueueQuery,
    DashboardQueueSummary,
} from '@/core/types/dashboard-queue'
import { processingQueueKinds } from '@/core/types/dashboard-queue'
import { ApiError } from '@/core/types/api-error'
import type { DemoTransaction } from './transaction'
import { canReadProcessingQueue } from './dashboard-processing-policy'
import { processingQueueEntries } from './dashboard-processing'
export async function dashboardQueueSummaries(
    transaction: DemoTransaction,
    actor: SessionUser,
): Promise<readonly DashboardQueueSummary[]> {
    const summaries: DashboardQueueSummary[] = []
    for (const kind of processingQueueKinds) {
        if (!canReadProcessingQueue(actor, kind)) continue
        const records = await processingQueueEntries(transaction, actor, kind)
        summaries.push({ kind, count: records.length, targetPath: '/dashboard/queue?kind=' + kind })
    }
    return summaries
}
export async function dashboardQueuePage(
    transaction: DemoTransaction,
    actor: SessionUser,
    query: DashboardQueueQuery,
): Promise<PageResponse<DashboardQueueEntry>> {
    if (!canReadProcessingQueue(actor, query.kind)) throw new ApiError('forbidden')
    const search = query.search.trim().toLocaleLowerCase('id')
    const records = (await processingQueueEntries(transaction, actor, query.kind))
        .filter((record) =>
            [record.label, record.purchaseOrderNumber].some((label) =>
                label.toLocaleLowerCase('id').includes(search),
            ),
        )
        .sort(
            (a, b) =>
                (query.sort === 'createdAt' ? 1 : -1) *
                (a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id)),
        )
    return {
        data: records.slice((query.page - 1) * query.perPage, query.page * query.perPage),
        meta: { page: query.page, perPage: query.perPage, total: records.length },
    }
}
