import type { BusinessOperation } from '@/core/constants/business-permissions'
import type { SessionUser } from '@/core/types/session'
import type { ProcessingQueueKind, QueueResource } from '@/core/types/dashboard-queue'
import { hasBusinessPermission } from '@/core/domain/record-policy'
export const processingQueueRules: Record<
    ProcessingQueueKind,
    { readonly resource: QueueResource; readonly actions: readonly BusinessOperation[] }
> = {
    'purchase-orders-processing': { resource: 'purchase-orders', actions: ['orders.create'] },
    'orders-processing': { resource: 'orders', actions: ['orders.update', 'orders.submit'] },
    'deliveries-processing': {
        resource: 'deliveries',
        actions: ['deliveries.update', 'deliveries.dispatch', 'deliveries.receive'],
    },
    'invoices-processing': { resource: 'invoices', actions: ['invoices.update', 'invoices.issue'] },
    'payments-processing': {
        resource: 'payments',
        actions: ['payments.update', 'payments.submit'],
    },
}
export function canReadProcessingQueue(actor: SessionUser, kind: ProcessingQueueKind): boolean {
    const rule = processingQueueRules[kind]
    return (
        actor.permissions.includes('dashboard.read.all') &&
        hasBusinessPermission(actor, `${rule.resource}.read`) &&
        rule.actions.some((action) => hasBusinessPermission(actor, action))
    )
}
