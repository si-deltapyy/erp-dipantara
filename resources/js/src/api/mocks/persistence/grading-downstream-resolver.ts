import type { GradingDownstream } from '../grading-downstream'
import { gradingDownstreamFixtures } from '../grading-downstream'
import type { DemoTransaction } from './transaction'

export async function persistentGradingDownstream(
    transaction: DemoTransaction,
): Promise<GradingDownstream> {
    const deliveries = await transaction.list('deliveries')
    return {
        allocations: () =>
            deliveries.flatMap((delivery) =>
                delivery.allocations.map((allocation) => ({
                    gradingId: allocation.gradingId,
                    rowId: allocation.rowId,
                    status: delivery.status === 'draft' ? ('reserved' as const) : delivery.status,
                })),
            ),
        hasIssuedInvoice: gradingDownstreamFixtures.hasIssuedInvoice,
    }
}
