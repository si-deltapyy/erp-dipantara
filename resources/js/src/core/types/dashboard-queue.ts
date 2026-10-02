import type { MasterListQuery } from './master-list'
export const processingQueueKinds = [
    'purchase-orders-processing',
    'orders-processing',
    'deliveries-processing',
    'invoices-processing',
    'payments-processing',
] as const
export type ProcessingQueueKind = (typeof processingQueueKinds)[number]
export const reviewQueueKinds = [
    'purchase-orders-review',
    'orders-review',
    'gradings-review',
    'payments-review',
    'closings-review',
] as const
export type ReviewQueueKind = (typeof reviewQueueKinds)[number]
export const dashboardQueueKinds = [...processingQueueKinds, ...reviewQueueKinds] as const
export type DashboardQueueKind = (typeof dashboardQueueKinds)[number]
export const queueResources = {
    'purchase-orders-processing': 'purchase-orders',
    'orders-processing': 'orders',
    'deliveries-processing': 'deliveries',
    'invoices-processing': 'invoices',
    'payments-processing': 'payments',
    'purchase-orders-review': 'purchase-orders',
    'orders-review': 'orders',
    'gradings-review': 'gradings',
    'payments-review': 'payments',
    'closings-review': 'closings',
} as const
export function isProcessingQueue(kind: DashboardQueueKind): kind is ProcessingQueueKind {
    return (processingQueueKinds as readonly string[]).includes(kind)
}
export const queueStatuses = {
    gradings: ['draft', 'submitted', 'approved', 'rejected', 'superseded'],
    closings: ['requested', 'approved', 'rejected'],
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
