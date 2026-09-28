import type { PurchaseOrderInvoiceSummary } from './invoice-summary'
export const closingReasonCodes = [
    'purchase_order_not_approved',
    'orders_incomplete',
    'assignments_incomplete',
    'grading_incomplete',
    'deliveries_incomplete',
    'buyer_invoice_missing',
    'mitra_invoice_missing',
    'buyer_outstanding',
    'mitra_outstanding',
    'open_work',
    'invoice_revision_required',
] as const
export type ClosingReasonCode = (typeof closingReasonCodes)[number]
export interface ClosingQuantities {
    readonly ordered: number
    readonly assigned: number
    readonly approved: number
    readonly received: number
}
export interface ClosingEligibility {
    readonly purchaseOrderId: string
    readonly version: number
    readonly snapshotToken: string
    readonly evaluatedAt: string
    readonly eligible: boolean
    readonly reasons: readonly ClosingReasonCode[]
    readonly quantities: ClosingQuantities
    readonly openWorkCount: number
    readonly summary: PurchaseOrderInvoiceSummary
    readonly allowedActions: readonly 'request'[]
}
export interface ClosingsApi {
    eligibility(purchaseOrderId: string, signal: AbortSignal): Promise<ClosingEligibility>
    subscribe(listener: () => void): () => void
}
