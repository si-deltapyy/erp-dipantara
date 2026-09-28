import type { SessionUser } from '@/core/types/session'
import type { DashboardSnapshot, DashboardQuery } from '@/core/types/dashboard'
import { parseDashboardQuery } from '@/api/dashboard-mapper'
import { graderDashboard } from './dashboard-grader'
import type { DatabaseOptions } from './database'
import { runDemoTransaction } from './transaction'
import { requireDataset } from './demo-repository'
import { requireDashboardActor } from './dashboard-policy'
import { operationalMetrics, financialMetrics } from './dashboard-projector'
import { ownerActivity } from './dashboard-activity'
import type { DashboardQueueEntry, DashboardQueueQuery } from '@/core/types/dashboard-queue'
import type { PageResponse } from '@/core/types/contracts'
import type { DemoStore } from './schema'
import { parseQueueQuery } from '@/api/dashboard-queue-mapper'
import { dashboardQueueSummaries, dashboardQueuePage } from './dashboard-queues'
const stores: readonly DemoStore[] = [
    'metadata',
    'purchase-orders',
    'orders',
    'deliveries',
    'invoices',
    'payments',
    'assignments',
    'gradings',
    'closings',
]
export class DashboardRepository {
    constructor(private readonly options: DatabaseOptions = {}) {}
    async get(
        user: SessionUser | null,
        signal: AbortSignal,
        query: DashboardQuery = {},
    ): Promise<DashboardSnapshot> {
        const actor = requireDashboardActor(user)
        const period =
            parseDashboardQuery(query).period ??
            new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' }).slice(0, 7)
        return runDemoTransaction(
            this.options,
            stores,
            'readonly',
            async (transaction) => {
                await requireDataset(transaction)
                return {
                    asOf: new Date().toISOString(),
                    activity: await ownerActivity(transaction, actor),
                    queues: await dashboardQueueSummaries(transaction, actor),
                    grader: await graderDashboard(transaction, actor, period),
                    metrics: [
                        ...(await operationalMetrics(transaction, actor)),
                        ...(await financialMetrics(transaction, actor)),
                    ],
                }
            },
            signal,
        )
    }
    async queue(
        user: SessionUser | null,
        query: DashboardQueueQuery,
        signal: AbortSignal,
    ): Promise<PageResponse<DashboardQueueEntry>> {
        const actor = requireDashboardActor(user)
        const filter = parseQueueQuery(query)
        return runDemoTransaction(
            this.options,
            stores,
            'readonly',
            async (transaction) => {
                await requireDataset(transaction)
                return dashboardQueuePage(transaction, actor, filter)
            },
            signal,
        )
    }
}
