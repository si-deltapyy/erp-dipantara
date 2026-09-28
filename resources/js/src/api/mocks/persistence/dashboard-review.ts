import type { SessionUser } from '@/core/types/session'
import type { DashboardQueueEntry, ReviewQueueKind } from '@/core/types/dashboard-queue'
import { queueResources } from '@/core/types/dashboard-queue'
import { evaluateRecordAccess, hasBusinessPermission } from '@/core/domain/record-policy'
import type { DemoTransaction } from './transaction'
import { presentPurchaseOrder } from '../purchase-order-policy'
import { presentOrder } from '../order-policy'
import { gradingAccess, presentGrading } from '../grading-policy'
import { presentPayment } from './payment-policy'
import { presentClosing } from './closing-policy'
import { queueEntry } from './dashboard-queue-entry'

export function canReadReviewQueue(actor: SessionUser, kind: ReviewQueueKind): boolean {
    const resource = queueResources[kind]
    return (
        actor.permissions.includes('dashboard.read.all') &&
        hasBusinessPermission(actor, `${resource}.read`) &&
        (hasBusinessPermission(actor, `${resource}.approve`) ||
            hasBusinessPermission(actor, `${resource}.reject`))
    )
}

export async function reviewQueueEntries(
    transaction: DemoTransaction,
    actor: SessionUser,
    kind: ReviewQueueKind,
): Promise<readonly DashboardQueueEntry[]> {
    const resource = queueResources[kind]
    const parents = new Map(
        (await transaction.list('purchase-orders')).map((order) => [order.id, order]),
    )
    if (resource === 'purchase-orders')
        return [...parents.values()]
            .map((order) => presentPurchaseOrder(order, actor, ''))
            .filter(
                (order) =>
                    evaluateRecordAccess(actor, 'purchase-orders.read', order) === 'allowed' &&
                    isReviewable(order),
            )
            .map((order) => queueEntry(resource, { ...order, purchaseOrderNumber: order.number }))
    if (resource === 'gradings') return gradingReviewEntries(transaction, actor, parents)
    const records =
        resource === 'orders'
            ? (await transaction.list('orders')).map((record) => presentOrder(record, actor, ''))
            : resource === 'payments'
              ? (await transaction.list('payments')).map((record) =>
                    presentPayment(record, actor, ''),
                )
              : (await transaction.list('closings')).map((record) =>
                    presentClosing(record, actor, ''),
                )
    return records
        .filter(
            (record) =>
                parents.get(record.purchaseOrderId)?.status === 'approved' &&
                evaluateRecordAccess(actor, `${resource}.read`, record) === 'allowed' &&
                isReviewable(record),
        )
        .map((record) => queueEntry(resource, record))
}

function isReviewable(record: { readonly allowedActions: readonly string[] }): boolean {
    return record.allowedActions.some((action) => action === 'approve' || action === 'reject')
}

async function gradingReviewEntries(
    transaction: DemoTransaction,
    actor: SessionUser,
    parents: ReadonlyMap<string, { readonly status: string }>,
): Promise<readonly DashboardQueueEntry[]> {
    const orders = new Map((await transaction.list('orders')).map((order) => [order.id, order]))
    const assignments = new Map(
        (await transaction.list('assignments')).map((assignment) => [assignment.id, assignment]),
    )
    return (await transaction.list('gradings')).flatMap((grading) => {
        const assignment = assignments.get(grading.assignmentId)
        if (
            !assignment ||
            parents.get(orders.get(assignment.orderId)?.purchaseOrderId ?? '')?.status !==
                'approved'
        )
            return []
        const record = presentGrading(grading, assignment, actor, '')
        return evaluateRecordAccess(actor, 'gradings.read', gradingAccess(record, assignment)) ===
            'allowed' && isReviewable(record)
            ? [queueEntry('gradings', record)]
            : []
    })
}
