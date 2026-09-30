import type { GraderDashboard } from './production'
import type { DashboardActivity } from './dashboard-activity'
import type {
    DashboardQueueEntry,
    DashboardQueueQuery,
    DashboardQueueSummary,
} from './dashboard-queue'
import type { PageResponse } from './contracts'
export const dashboardTargets = {
    'active-purchase-orders': '/purchase-orders?status=approved',
    'prepared-deliveries': '/deliveries?status=draft',
    'dispatched-deliveries': '/deliveries?status=dispatched',
    'buyer-outstanding': '/invoices?direction=receivable&balance=outstanding',
    'mitra-outstanding': '/invoices?direction=payable&balance=outstanding',
} as const
export type DashboardMetricKey = keyof typeof dashboardTargets
export type DashboardMetric =
    | {
          readonly key: 'active-purchase-orders' | 'prepared-deliveries' | 'dispatched-deliveries'
          readonly value: number
          readonly unit: 'count'
          readonly targetPath: string
      }
    | {
          readonly key: 'buyer-outstanding' | 'mitra-outstanding'
          readonly value: string
          readonly unit: 'IDR'
          readonly targetPath: string
      }
export interface DashboardSnapshot {
    readonly grader: GraderDashboard | null
    readonly queues: readonly DashboardQueueSummary[]
    readonly activity: readonly DashboardActivity[]
    readonly asOf: string
    readonly metrics: readonly DashboardMetric[]
}
export interface DashboardApi {
    queue(
        query: DashboardQueueQuery,
        signal: AbortSignal,
    ): Promise<PageResponse<DashboardQueueEntry>>
    get(signal: AbortSignal, query?: DashboardQuery): Promise<DashboardSnapshot>
    subscribe(listener: () => void): () => void
}

export interface DashboardQuery {
    readonly period?: string
}
