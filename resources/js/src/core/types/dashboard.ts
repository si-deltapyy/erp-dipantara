import type { DashboardQueueEntry, DashboardQueueQuery } from './dashboard-queue'
import type { PageResponse } from './contracts'

export type DashboardMetric =
    | {
          readonly key:
              'active-purchase-orders' | 'awaiting-deposit' | 'in-progress' | 'awaiting-payment'
          readonly value: number
          readonly unit: 'count'
      }
    | {
          readonly key: 'receivables' | 'payables' | 'income' | 'expenses' | 'net'
          readonly value: string
          readonly unit: 'IDR'
      }
export interface DashboardSnapshot {
    readonly metrics: readonly DashboardMetric[]
    readonly cashflow: readonly DashboardMetric[]
}
export interface DashboardApi {
    queue(
        query: DashboardQueueQuery,
        signal: AbortSignal,
    ): Promise<PageResponse<DashboardQueueEntry>>
    get(signal: AbortSignal): Promise<DashboardSnapshot>
    subscribe(listener: () => void): () => void
}
