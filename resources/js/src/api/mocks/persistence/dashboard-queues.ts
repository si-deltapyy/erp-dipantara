import { canReadReviewQueue, reviewQueueEntries } from './dashboard-review'
import type { SessionUser } from '@/core/types/session'
import type { PageResponse } from '@/core/types/contracts'
import type {
    DashboardQueueKind,
    DashboardQueueEntry,
    DashboardQueueQuery,
    DashboardQueueSummary,
} from '@/core/types/dashboard-queue'
import { dashboardQueueKinds, isProcessingQueue } from '@/core/types/dashboard-queue'
import { ApiError } from '@/core/types/api-error'
import type { DemoTransaction } from './transaction'
import { canReadProcessingQueue } from './dashboard-processing-policy'
import { processingQueueEntries } from './dashboard-processing'
export async function dashboardQueueSummaries(
    transaction: DemoTransaction,
    actor: SessionUser,
): Promise<readonly DashboardQueueSummary[]> {
    const summaries: DashboardQueueSummary[] = []
    for (const kind of dashboardQueueKinds) {
        if (!canReadQueue(actor, kind)) continue
        const records = await queueEntries(transaction, actor, kind)
        summaries.push({ kind, count: records.length, targetPath: '/dashboard/queue?kind=' + kind })
    }
    return summaries
}
export async function dashboardQueuePage(
    transaction: DemoTransaction,
    actor: SessionUser,
    query: DashboardQueueQuery,
): Promise<PageResponse<DashboardQueueEntry>> {
    if (!canReadQueue(actor, query.kind)) throw new ApiError('forbidden')
    const search = query.search.trim().toLocaleLowerCase('id')
    const records = (await queueEntries(transaction, actor, query.kind))
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

function canReadQueue(actor: SessionUser, kind: DashboardQueueKind): boolean {
    return isProcessingQueue(kind)
        ? canReadProcessingQueue(actor, kind)
        : canReadReviewQueue(actor, kind)
}
function queueEntries(
    transaction: DemoTransaction,
    actor: SessionUser,
    kind: DashboardQueueKind,
): Promise<readonly DashboardQueueEntry[]> {
    return isProcessingQueue(kind)
        ? processingQueueEntries(transaction, actor, kind)
        : reviewQueueEntries(transaction, actor, kind)
}
