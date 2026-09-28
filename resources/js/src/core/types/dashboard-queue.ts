import type { MasterListQuery } from './master-list'
export const processingQueueKinds = [
    'purchase-orders-processing',
    'orders-processing',
    'deliveries-processing',
    'invoices-processing',
    'payments-processing',
] as const
export type DashboardQueueKind = (typeof processingQueueKinds)[number]
export const queueStatuses = {
    'purchase-orders': ['draft', 'submitted', 'approved', 'rejected', 'closed'],
    orders: ['draft', 'submitted', 'approved', 'rejected'],
    deliveries: ['draft', 'dispatched', 'received'],
    invoices: ['draft', 'issued', 'superseded'],
    payments: ['draft', 'submitted', 'approved', 'rejected'],
} as const
export type QueueResource = keyof typeof queueStatuses
export interface DashboardQueueEntry {
    readonly resource: QueueResource
    readonly id: string
    readonly label: string
    readonly purchaseOrderNumber: string
    readonly status: string
    readonly version: number
    readonly createdAt: string
    readonly updatedAt: string
    readonly targetPath: string
}
export interface DashboardQueueSummary {
    readonly kind: DashboardQueueKind
    readonly count: number
    readonly targetPath: string
}
export interface DashboardQueueQuery extends MasterListQuery {
    readonly kind: DashboardQueueKind
}
