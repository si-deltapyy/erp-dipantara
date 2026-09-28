import type { AvailableTimber } from '@/core/types/delivery'
import type { Grading } from '@/core/types/grading'
import type { DemoTransaction } from './transaction'
import { ApiError } from '@/core/types/api-error'
import { requireDataset } from './demo-repository'

export function gradingLineage(grading: Grading, records: readonly Grading[]): readonly string[] {
    const ids = new Set<string>()
    let current: Grading | undefined = grading
    while (current) {
        if (ids.has(current.id)) throw new ApiError('conflict')
        ids.add(current.id)
        current = current.revisionOfId
            ? records.find((candidate) => candidate.id === current?.revisionOfId)
            : undefined
    }
    return [...ids]
}
export async function deliveryAvailability(
    transaction: DemoTransaction,
    purchaseOrderId: string,
    excludeDeliveryId?: string,
): Promise<readonly AvailableTimber[]> {
    const metadata = await requireDataset(transaction)
    const gradings = await transaction.list('gradings')
    const assignments = await transaction.list('assignments')
    const orders = await transaction.list('orders')
    const deliveries = (await transaction.list('deliveries')).filter(
        (delivery) =>
            delivery.id !== excludeDeliveryId && delivery.purchaseOrderId === purchaseOrderId,
    )
    const result: AvailableTimber[] = []
    for (const grading of gradings.filter((record) => record.status === 'approved')) {
        const assignment = assignments.find((record) => record.id === grading.assignmentId)
        const order = orders.find((record) => record.id === assignment?.orderId)
        if (
            !assignment ||
            order?.purchaseOrderId !== purchaseOrderId ||
            order.status !== 'approved'
        )
            continue
        const lineage = gradingLineage(grading, gradings)
        for (const row of grading.rows) {
            let reservedQuantity = 0
            let shippedQuantity = 0
            for (const delivery of deliveries) {
                for (const allocation of delivery.allocations) {
                    if (!lineage.includes(allocation.gradingId) || allocation.rowId !== row.rowId)
                        continue
                    if (delivery.status === 'draft') reservedQuantity += allocation.quantity
                    else shippedQuantity += allocation.quantity
                }
            }
            if (reservedQuantity + shippedQuantity > row.quantity) throw new ApiError('conflict')
            result.push({
                gradingId: grading.id,
                lineageIds: lineage,
                rowId: row.rowId,
                assignmentId: assignment.id,
                mitraName: grading.mitraName,
                timberProductName:
                    grading.rowResults.find((result) => result.rowId === row.rowId)
                        ?.timberProductName ?? assignment.timberProductName,
                approvedQuantity: row.quantity,
                reservedQuantity,
                shippedQuantity,
                availableQuantity: row.quantity - reservedQuantity - shippedQuantity,
                snapshotToken: `${metadata.generation}:${metadata.revision}`,
            })
        }
    }
    return result
}
