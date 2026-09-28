import type { SessionUser } from '@/core/types/session'
import type { RecordMetadata } from '@/core/types/contracts'
import type {
    DashboardQueueEntry,
    DashboardQueueKind,
    QueueResource,
} from '@/core/types/dashboard-queue'
import type { DemoTransaction } from './transaction'
import { evaluateRecordAccess } from '@/core/domain/record-policy'
import { presentOrder } from '../order-policy'
import { presentDelivery } from '../delivery-policy'
import { presentInvoice } from './invoice-policy'
import { presentPayment } from './payment-policy'
import { processingQueueRules } from './dashboard-processing-policy'
type ProcessingRecord = RecordMetadata & {
    readonly id: string
    readonly purchaseOrderId: string
    readonly purchaseOrderNumber: string
    readonly status: string
    readonly updatedAt: string
    readonly createdAt: string
    readonly number?: string | null
    readonly invoiceNumber?: string
    readonly licensePlate?: string
}
function queueEntry(
    resource: QueueResource,
    record: Omit<ProcessingRecord, 'purchaseOrderId'>,
): DashboardQueueEntry {
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
async function downstreamRecords(
    transaction: DemoTransaction,
    actor: SessionUser,
    kind: DashboardQueueKind,
): Promise<readonly ProcessingRecord[]> {
    if (kind === 'orders-processing')
        return (await transaction.list('orders')).map((record) => presentOrder(record, actor, ''))
    if (kind === 'deliveries-processing')
        return (await transaction.list('deliveries')).map((record) =>
            presentDelivery(record, actor, ''),
        )
    if (kind === 'invoices-processing')
        return (await transaction.list('invoices')).map((record) =>
            presentInvoice(record, actor, ''),
        )
    if (kind === 'payments-processing')
        return (await transaction.list('payments')).map((record) =>
            presentPayment(record, actor, ''),
        )
    return []
}
export async function processingQueueEntries(
    transaction: DemoTransaction,
    actor: SessionUser,
    kind: DashboardQueueKind,
): Promise<readonly DashboardQueueEntry[]> {
    const parents = new Map(
        (await transaction.list('purchase-orders')).map((order) => [order.id, order]),
    )
    if (kind === 'purchase-orders-processing') {
        const processed = new Set(
            (await transaction.list('orders')).map((order) => order.purchaseOrderId),
        )
        return [...parents.values()]
            .filter(
                (order) =>
                    order.status === 'approved' &&
                    !processed.has(order.id) &&
                    evaluateRecordAccess(actor, 'purchase-orders.read', order) === 'allowed' &&
                    evaluateRecordAccess(actor, 'orders.create', order) === 'allowed',
            )
            .map((order) =>
                queueEntry('purchase-orders', { ...order, purchaseOrderNumber: order.number }),
            )
    }
    const rule = processingQueueRules[kind]
    const actions = rule.actions.map((action) => action.split('.')[1])
    return (await downstreamRecords(transaction, actor, kind))
        .filter((record) => {
            const parent = parents.get(record.purchaseOrderId)
            return (
                !!parent &&
                parent.status === 'approved' &&
                evaluateRecordAccess(actor, `${rule.resource}.read`, record) === 'allowed' &&
                record.allowedActions.some((action) => actions.includes(action))
            )
        })
        .map((record) => queueEntry(rule.resource, record))
}
