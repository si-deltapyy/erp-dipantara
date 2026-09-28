import type { ClosingEligibility } from '@/core/types/closing'
import type { SessionUser } from '@/core/types/session'
import type { DemoTransaction } from './transaction'
import { ApiError } from '@/core/types/api-error'
import { evaluateClosingQuantities } from '@/core/domain/closing-quantities'
import { evaluateClosingWork } from '@/core/domain/closing-eligibility'
import { requireDataset } from './demo-repository'
import { loadClosingSnapshot } from './closing-snapshot'
import { aggregateInvoiceSummary } from './invoice-summary'
import { approvedPaymentCredit } from './payment-credit'

export async function closingEligibility(
    transaction: DemoTransaction,
    actor: SessionUser,
    purchaseOrderId: string,
    excludeClosingId?: string,
): Promise<ClosingEligibility> {
    const metadata = await requireDataset(transaction)
    const purchaseOrder = await transaction.get('purchase-orders', purchaseOrderId)
    if (!purchaseOrder) throw new ApiError('not-found')
    const snapshot = await loadClosingSnapshot(transaction, purchaseOrder)
    const summary = await aggregateInvoiceSummary(
        transaction,
        purchaseOrderId,
        snapshot.invoices.filter((invoice) => !!invoice.issuedRevisionNumber),
        approvedPaymentCredit,
    )
    const quantities = evaluateClosingQuantities(snapshot)
    const work = evaluateClosingWork(snapshot, summary)
    const reasons = [...quantities.reasons, ...work.reasons]
    if (
        (await transaction.list('closings')).some(
            (closing) =>
                closing.purchaseOrderId === purchaseOrderId &&
                closing.status === 'requested' &&
                closing.id !== excludeClosingId,
        )
    )
        reasons.push('active_request')
    if (purchaseOrder.status !== 'approved') reasons.unshift('purchase_order_not_approved')
    return {
        purchaseOrderId,
        version: purchaseOrder.version,
        snapshotToken: `${metadata.generation}:${metadata.revision}`,
        evaluatedAt: new Date().toISOString(),
        eligible: !reasons.length,
        reasons,
        quantities: quantities.quantities,
        openWorkCount: work.openWorkCount,
        summary,
        allowedActions:
            !reasons.length && actor.permissions.includes('closings.request.all')
                ? ['request']
                : [],
    }
}
