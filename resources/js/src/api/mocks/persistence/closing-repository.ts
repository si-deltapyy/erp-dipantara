import type { ClosingEligibility } from '@/core/types/closing'
import type { SessionUser } from '@/core/types/session'
import type { DatabaseOptions } from './database'
import type { DemoStore } from './schema'
import type { DemoTransaction } from './transaction'
import { ApiError } from '@/core/types/api-error'
import { parseId } from '@/api/contracts/value-parsers'
import { evaluateClosingQuantities } from '@/core/domain/closing-quantities'
import { evaluateClosingWork } from '@/core/domain/closing-eligibility'
import { requireDataset } from './demo-repository'
import { runDemoTransaction } from './transaction'
import { loadClosingSnapshot } from './closing-snapshot'
import { aggregateInvoiceSummary } from './invoice-summary'
import { approvedPaymentCredit } from './payment-credit'
export const closingStores: readonly DemoStore[] = [
    'metadata',
    'purchase-orders',
    'orders',
    'assignments',
    'gradings',
    'deliveries',
    'invoices',
    'invoiceVersions',
    'payments',
]
export function requireClosingPermission(user: SessionUser | null, action: string): SessionUser {
    if (!user) throw new ApiError('unauthenticated')
    if (!user.permissions.includes(`closings.${action}.all`)) throw new ApiError('forbidden')
    return user
}
export async function closingEligibility(
    transaction: DemoTransaction,
    actor: SessionUser,
    purchaseOrderId: string,
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
export class ClosingRepository {
    constructor(private readonly options: DatabaseOptions = {}) {}
    async eligibility(
        user: SessionUser | null,
        id: string,
        signal: AbortSignal,
    ): Promise<ClosingEligibility> {
        const actor = requireClosingPermission(user, 'read')
        parseId(id)
        return runDemoTransaction(
            this.options,
            closingStores,
            'readonly',
            (transaction) => closingEligibility(transaction, actor, id),
            signal,
        )
    }
}
