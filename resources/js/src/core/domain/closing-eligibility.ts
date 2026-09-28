import type { ClosingReasonCode } from '@/core/types/closing'
import type { PurchaseOrderInvoiceSummary } from '@/core/types/invoice-summary'
import type { Grading } from '@/core/types/grading'
import type { Invoice } from '@/core/types/invoice'
import type { Order } from '@/core/types/order'
import type { Payment } from '@/core/types/payment'
import type { Assignment } from '@/core/types/assignment'
import { moneyUnits } from './money-arithmetic'
interface WorkSnapshot {
    readonly orders: readonly Order[]
    readonly assignments: readonly Assignment[]
    readonly gradings: readonly Grading[]
    readonly invoices: readonly Invoice[]
    readonly payments: readonly Payment[]
}
export function evaluateClosingWork(
    snapshot: WorkSnapshot,
    summary: PurchaseOrderInvoiceSummary,
): {
    reasons: readonly ClosingReasonCode[]
    openWorkCount: number
} {
    const { orders, assignments, gradings, invoices, payments } = snapshot
    const reasons: ClosingReasonCode[] = []
    const openWorkCount =
        orders.filter((order) => order.status !== 'approved').length +
        gradings.filter((grading) => !['approved', 'superseded'].includes(grading.status)).length +
        invoices.filter((invoice) => invoice.status === 'draft').length +
        payments.filter((payment) => payment.status !== 'approved').length
    if (!orders.length || orders.some((order) => order.status !== 'approved'))
        reasons.push('orders_incomplete')
    if (openWorkCount) reasons.push('open_work')
    if (!summary.receivable.issuedInvoiceCount) reasons.push('buyer_invoice_missing')
    if (
        !assignments.length ||
        assignments.some(
            (assignment) =>
                !invoices.some(
                    (invoice) =>
                        invoice.direction === 'payable' &&
                        invoice.mitraId === assignment.mitraId &&
                        !!invoice.issuedRevisionNumber,
                ),
        )
    )
        reasons.push('mitra_invoice_missing')
    if (moneyUnits(summary.receivable.outstandingAmount) !== 0n) reasons.push('buyer_outstanding')
    if (moneyUnits(summary.payable.outstandingAmount) !== 0n) reasons.push('mitra_outstanding')
    const latestCorrection = gradings
        .filter((grading) => grading.status === 'approved' && grading.invoiceRevisionRequired)
        .reduce((latest, grading) => (grading.updatedAt > latest ? grading.updatedAt : latest), '')
    if (
        latestCorrection &&
        invoices.some(
            (invoice) =>
                invoice.issuedRevisionNumber &&
                (invoice.status !== 'issued' || invoice.updatedAt < latestCorrection),
        )
    )
        reasons.push('invoice_revision_required')
    return { reasons, openWorkCount }
}
