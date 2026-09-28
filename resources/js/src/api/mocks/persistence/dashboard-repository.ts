import type { SessionUser } from '@/core/types/session'
import type { DashboardSnapshot } from '@/core/types/dashboard'
import type { DatabaseOptions } from './database'
import { runDemoTransaction } from './transaction'
import { requireDataset } from './demo-repository'
import { requireDashboardActor } from './dashboard-policy'
import { operationalMetrics, financialMetrics } from './dashboard-projector'
export class DashboardRepository {
    constructor(private readonly options: DatabaseOptions = {}) {}
    async get(user: SessionUser | null, signal: AbortSignal): Promise<DashboardSnapshot> {
        const actor = requireDashboardActor(user)
        return runDemoTransaction(
            this.options,
            ['metadata', 'purchase-orders', 'deliveries', 'invoices', 'payments'],
            'readonly',
            async (transaction) => {
                await requireDataset(transaction)
                return {
                    asOf: new Date().toISOString(),
                    metrics: [
                        ...(await operationalMetrics(transaction, actor)),
                        ...(await financialMetrics(transaction, actor)),
                    ],
                }
            },
            signal,
        )
    }
}
