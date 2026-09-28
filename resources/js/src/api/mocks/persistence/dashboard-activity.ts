import type { SessionUser } from '@/core/types/session'
import type { DashboardActivity, ActivityResource } from '@/core/types/dashboard-activity'
import type { DemoTransaction } from './transaction'
import { evaluateRecordAccess } from '@/core/domain/record-policy'
function activityRecord(
    resource: ActivityResource,
    record: { readonly id: string; readonly status: string; readonly updatedAt: string },
    purchaseOrderNumber: string,
    label: string,
): DashboardActivity {
    return {
        resource,
        id: record.id,
        status: record.status,
        updatedAt: record.updatedAt,
        purchaseOrderNumber,
        label,
        targetPath: `/${resource}/${encodeURIComponent(record.id)}`,
    }
}
export async function ownerActivity(
    transaction: DemoTransaction,
    actor: SessionUser,
): Promise<readonly DashboardActivity[]> {
    if (
        !actor.permissions.includes('dashboard.read.own') ||
        actor.permissions.includes('dashboard.read.all')
    )
        return []
    const owned = new Map(
        (await transaction.list('purchase-orders'))
            .filter((order) => order.createdByUserId === actor.id)
            .map((order) => [order.id, order]),
    )
    const activity: DashboardActivity[] = []
    for (const order of owned.values())
        if (evaluateRecordAccess(actor, 'purchase-orders.read', order) === 'allowed')
            activity.push(activityRecord('purchase-orders', order, order.number, order.number))
    for (const invoice of await transaction.list('invoices')) {
        const order = owned.get(invoice.purchaseOrderId)
        if (order && evaluateRecordAccess(actor, 'invoices.read', invoice) === 'allowed')
            activity.push(
                activityRecord('invoices', invoice, order.number, invoice.number ?? order.number),
            )
    }
    for (const payment of await transaction.list('payments')) {
        const order = owned.get(payment.purchaseOrderId)
        if (order && evaluateRecordAccess(actor, 'payments.read', payment) === 'allowed')
            activity.push(activityRecord('payments', payment, order.number, payment.invoiceNumber))
    }
    return activity
        .sort(
            (a, b) =>
                b.updatedAt.localeCompare(a.updatedAt) ||
                a.resource.localeCompare(b.resource) ||
                a.id.localeCompare(b.id),
        )
        .slice(0, 10)
}
