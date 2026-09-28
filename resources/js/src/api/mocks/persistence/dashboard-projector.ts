import type { SessionUser } from '@/core/types/session'
import type { DashboardMetric } from '@/core/types/dashboard'
import { dashboardTargets } from '@/core/types/dashboard'
import { evaluateRecordAccess } from '@/core/domain/record-policy'
import { sumMoney } from '@/core/domain/money-arithmetic'
import type { DemoTransaction } from './transaction'
import { hasDashboardDrilldown } from './dashboard-policy'
import { approvedPaymentCredit } from './payment-credit'
import { normalizeIssuedInvoice } from './invoice-settlement'
import { outstandingInvoices } from './invoice-balance-filter'
export async function operationalMetrics(
    transaction: DemoTransaction,
    actor: SessionUser,
): Promise<readonly DashboardMetric[]> {
    const metrics: DashboardMetric[] = []
    if (hasDashboardDrilldown(actor, 'purchase-orders.read')) {
        const orders = (await transaction.list('purchase-orders')).filter(
            (order) =>
                order.status === 'approved' &&
                evaluateRecordAccess(actor, 'purchase-orders.read', order) === 'allowed',
        )
        metrics.push({
            key: 'active-purchase-orders',
            value: orders.length,
            unit: 'count',
            targetPath: dashboardTargets['active-purchase-orders'],
        })
    }
    if (
        hasDashboardDrilldown(actor, 'deliveries.read') &&
        (!actor.permissions.includes('deliveries.read.assigned') ||
            actor.permissions.includes('deliveries.read.all'))
    ) {
        const deliveries = (await transaction.list('deliveries')).filter(
            (delivery) => evaluateRecordAccess(actor, 'deliveries.read', delivery) === 'allowed',
        )
        for (const [key, status] of [
            ['prepared-deliveries', 'draft'],
            ['dispatched-deliveries', 'dispatched'],
        ] as const)
            metrics.push({
                key,
                value: deliveries.filter((delivery) => delivery.status === status).length,
                unit: 'count',
                targetPath: dashboardTargets[key],
            })
    }
    return metrics
}
export async function financialMetrics(
    transaction: DemoTransaction,
    actor: SessionUser,
): Promise<readonly DashboardMetric[]> {
    if (!hasDashboardDrilldown(actor, 'invoices.read')) return []
    const invoices = (await transaction.list('invoices'))
        .map(normalizeIssuedInvoice)
        .filter(
            (invoice) =>
                !!invoice.issuedRevisionNumber &&
                evaluateRecordAccess(actor, 'invoices.read', invoice) === 'allowed',
        )
    const balances = await outstandingInvoices(transaction, invoices, approvedPaymentCredit)
    return (
        [
            ['buyer-outstanding', 'receivable'],
            ['mitra-outstanding', 'payable'],
        ] as const
    ).map(([key, direction]) => ({
        key,
        value: sumMoney(
            balances
                .filter((invoice) => invoice.direction === direction)
                .map((invoice) => invoice.outstandingAmount),
        ),
        unit: 'IDR',
        targetPath: dashboardTargets[key],
    }))
}
