import type { RecordMetadata, PageResponse } from './contracts'
import type { MasterListQuery } from './master-list'
import type { WorkflowWriteOptions } from './workflow'
import type { PurchaseOrderInvoiceSummary } from './invoice-summary'
export const closingReasonCodes = [
    'purchase_order_not_approved',
    'active_request',
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
export const closingStatuses = ['requested', 'approved', 'rejected'] as const
export interface ClosingInput {
    readonly purchaseOrderId: string
    readonly version: number
    readonly snapshotToken: string
    readonly notes: string | null
}
export interface Closing extends RecordMetadata {
    readonly id: string
    readonly purchaseOrderId: string
    readonly purchaseOrderNumber: string
    readonly ownerUserId: string
    readonly purchaseOrderVersion: number
    readonly eligibilityToken: string
    readonly status: (typeof closingStatuses)[number]
    readonly notes: string | null
    readonly rejectionReason: string | null
    readonly createdAt: string
    readonly updatedAt: string
    readonly snapshotGeneration?: string
}
export interface ClosingQuery extends MasterListQuery {
    readonly purchaseOrderId?: string
    readonly status?: Closing['status']
}
export interface ClosingsApi {
    list(query: ClosingQuery, signal: AbortSignal): Promise<PageResponse<Closing>>
    get(id: string, signal: AbortSignal): Promise<Closing>
    create(input: ClosingInput, options: WorkflowWriteOptions): Promise<Closing>
    eligibility(purchaseOrderId: string, signal: AbortSignal): Promise<ClosingEligibility>
    subscribe(listener: () => void): () => void
}
