import type { Grading, GradingRow } from '@/core/types/grading'
import { ApiError } from '@/core/types/api-error'
import { invoiceFixtures } from './invoice-fixtures'
export interface GradingAllocationFixture {
    readonly gradingId: string
    readonly rowId: string
    readonly status: 'reserved' | 'dispatched' | 'received'
}
export interface GradingDownstream {
    allocations(): readonly GradingAllocationFixture[]
    hasIssuedInvoice(purchaseOrderId: string, mitraId: string): boolean
}
export const gradingDownstreamFixtures: GradingDownstream = {
    allocations: () => [],
    hasIssuedInvoice: (purchaseOrderId, mitraId) =>
        invoiceFixtures.some(
            (invoice) =>
                invoice.purchaseOrderId === purchaseOrderId &&
                invoice.mitraId === mitraId &&
                invoice.status === 'issued',
        ),
}
export function equalGradingRow(left: GradingRow, right: GradingRow): boolean {
    return (
        left.rowId === right.rowId &&
        left.timberProductId === right.timberProductId &&
        left.quantity === right.quantity &&
        left.diameterCm === right.diameterCm &&
        left.lengthM === right.lengthM &&
        left.gradeCode === right.gradeCode
    )
}
export function assertUnallocatedChanges(
    parent: Grading,
    rows: readonly GradingRow[],
    lineageIds: readonly string[],
    downstream: GradingDownstream,
): void {
    const protectedIds = new Set(
        downstream
            .allocations()
            .filter((allocation) => lineageIds.includes(allocation.gradingId))
            .map((allocation) => allocation.rowId),
    )
    for (const previous of parent.rows) {
        if (!protectedIds.has(previous.rowId)) continue
        const replacement = rows.find((row) => row.rowId === previous.rowId)
        if (!replacement || !equalGradingRow(previous, replacement))
            throw new ApiError('conflict', { rows: ['gradings.allocatedRow'] })
    }
}
export function changedGradingRows(parent: Grading, revision: Grading): boolean {
    return (
        parent.rows.length !== revision.rows.length ||
        parent.rows.some(
            (row) => !revision.rows.some((replacement) => equalGradingRow(row, replacement)),
        )
    )
}
