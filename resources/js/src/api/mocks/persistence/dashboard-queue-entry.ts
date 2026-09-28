import type { DashboardQueueEntry, QueueResource } from '@/core/types/dashboard-queue'
interface QueueRecord {
    readonly id: string
    readonly purchaseOrderNumber: string
    readonly status: string
    readonly version: number
    readonly createdAt: string
    readonly updatedAt: string
    readonly number?: string | null
    readonly invoiceNumber?: string
    readonly licensePlate?: string
}
export function queueEntry(resource: QueueResource, record: QueueRecord): DashboardQueueEntry {
    return {
        resource,
        id: record.id,
        label:
            record.number ??
            record.invoiceNumber ??
            record.licensePlate ??
            record.purchaseOrderNumber,
        purchaseOrderNumber: record.purchaseOrderNumber,
        status: record.status,
        version: record.version,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
        targetPath: `/${resource}/${encodeURIComponent(record.id)}`,
    }
}
