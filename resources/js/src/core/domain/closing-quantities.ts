import type { ClosingQuantities, ClosingReasonCode } from '@/core/types/closing'
import type { PurchaseOrder } from '@/core/types/purchase-order'
import type { Assignment } from '@/core/types/assignment'
import type { Grading } from '@/core/types/grading'
import type { Delivery } from '@/core/types/delivery'
interface TimberQuantity {
    readonly timberProductId: string
    readonly quantity: number
}
interface QuantitySnapshot {
    readonly purchaseOrder: PurchaseOrder
    readonly assignments: readonly Assignment[]
    readonly gradings: readonly Grading[]
    readonly deliveries: readonly Delivery[]
}
function quantitiesMatch(
    expected: readonly TimberQuantity[],
    actual: readonly TimberQuantity[],
): boolean {
    const sum = (rows: readonly TimberQuantity[], id: string): number =>
        rows
            .filter((row) => row.timberProductId === id)
            .reduce((total, row) => total + row.quantity, 0)
    const products = new Set([...expected, ...actual].map((row) => row.timberProductId))
    return products.size > 0 && [...products].every((id) => sum(expected, id) === sum(actual, id))
}
function receivedRows(
    snapshot: QuantitySnapshot,
): readonly (TimberQuantity & { assignmentId: string })[] {
    return snapshot.deliveries
        .filter((delivery) => delivery.status === 'received')
        .flatMap((delivery) =>
            delivery.allocations.map((allocation) => {
                const grading = snapshot.gradings.find(
                    (record) => record.id === allocation.gradingId,
                )
                const row = grading?.rows.find((record) => record.rowId === allocation.rowId)
                return {
                    timberProductId: row?.timberProductId ?? 'missing-grading-row',
                    assignmentId: grading?.assignmentId ?? 'missing-assignment',
                    quantity: allocation.quantity,
                }
            }),
        )
}
export function evaluateClosingQuantities(snapshot: QuantitySnapshot): {
    quantities: ClosingQuantities
    reasons: readonly ClosingReasonCode[]
} {
    const approved = snapshot.gradings.filter((grading) => grading.status === 'approved')
    const gradedRows = approved.flatMap((grading) => grading.rows)
    const received = receivedRows(snapshot)
    const reasons: ClosingReasonCode[] = []
    if (!quantitiesMatch(snapshot.purchaseOrder.lines, snapshot.assignments))
        reasons.push('assignments_incomplete')
    if (
        !quantitiesMatch(snapshot.assignments, gradedRows) ||
        snapshot.assignments.some(
            (assignment) =>
                !quantitiesMatch(
                    [assignment],
                    approved
                        .filter((grading) => grading.assignmentId === assignment.id)
                        .flatMap((grading) => grading.rows),
                ),
        )
    )
        reasons.push('grading_incomplete')
    if (
        !snapshot.deliveries.length ||
        !quantitiesMatch(snapshot.purchaseOrder.lines, received) ||
        snapshot.deliveries.some((delivery) => delivery.status !== 'received') ||
        snapshot.assignments.some(
            (assignment) =>
                !quantitiesMatch(
                    [assignment],
                    received.filter((row) => row.assignmentId === assignment.id),
                ),
        )
    )
        reasons.push('deliveries_incomplete')
    const sum = (rows: readonly { quantity: number }[]): number =>
        rows.reduce((total, row) => total + row.quantity, 0)
    return {
        quantities: {
            ordered: sum(snapshot.purchaseOrder.lines),
            assigned: sum(snapshot.assignments),
            approved: sum(gradedRows),
            received: sum(received),
        },
        reasons,
    }
}
