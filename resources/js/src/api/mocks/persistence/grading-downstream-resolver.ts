import type { GradingDownstream } from '../grading-downstream'
import type { DemoTransaction } from './transaction'

export async function persistentGradingDownstream(
    transaction: DemoTransaction,
): Promise<GradingDownstream> {
    const deliveries = await transaction.list('deliveries')
    const invoices = await transaction.list('invoices')
    return {
        allocations: () =>
            deliveries.flatMap((delivery) =>
                delivery.allocations.map((allocation) => ({
                    gradingId: allocation.gradingId,
                    rowId: allocation.rowId,
                    status: delivery.status === 'draft' ? ('reserved' as const) : delivery.status,
                })),
            ),
        hasIssuedInvoice: (purchaseOrderId, mitraId) =>
            invoices.some(
                (invoice) =>
                    (invoice.status === 'issued' || !!invoice.issuedRevisionNumber) &&
                    invoice.purchaseOrderId === purchaseOrderId &&
                    invoice.mitraId === mitraId,
            ),
    }
}
