import type { PurchaseOrderInvoiceSummary } from './invoice-summary'
import type { InvoiceSettlement } from './invoice-settlement'
import type { PageResponse, RecordMetadata } from './contracts'
import type { WorkflowVersion, WorkflowWriteOptions } from './workflow'
import type { MasterListQuery } from './master-list'
export interface InvoiceTerm {
    readonly label: string
    readonly amount: string
    readonly dueDate: string | null
}
export interface InvoiceInput {
    readonly purchaseOrderId: string
    readonly mitraId: string | null
    readonly direction: 'receivable' | 'payable'
    readonly kind: 'down_payment' | 'settlement'
    readonly invoiceDate: string
    readonly terms: readonly InvoiceTerm[]
    readonly notes: string | null
}
export interface Invoice extends InvoiceInput, RecordMetadata {
    readonly id: string
    readonly issuedRevisionNumber: number | null
    readonly issuedTotalAmount: string | null
    readonly revisionReason: string | null
    readonly ownerUserId: string
    readonly purchaseOrderNumber: string
    readonly counterpartyName: string
    readonly snapshotGeneration?: string
    readonly status: 'draft' | 'issued' | 'superseded'
    readonly number: string | null
    readonly totalAmount: string
    readonly outstandingAmount: string
    readonly revisionNumber: number
    readonly documentId: string | null
    readonly createdAt: string
    readonly updatedAt: string
}
export interface InvoiceQuery extends MasterListQuery {
    readonly status?: 'draft' | 'issued' | 'superseded'
    readonly purchaseOrderId?: string
    readonly mitraId?: string
    readonly direction?: 'receivable' | 'payable'
}
export interface InvoiceRevision extends WorkflowVersion {
    readonly reason: string
    readonly terms: readonly InvoiceTerm[]
}
export interface InvoiceVersion extends WorkflowVersion {
    readonly revisionNumber: number
}
export interface InvoicesApi {
    summary(purchaseOrderId: string, signal: AbortSignal): Promise<PurchaseOrderInvoiceSummary>
    settlement(id: string, signal: AbortSignal): Promise<InvoiceSettlement>
    revise(id: string, input: InvoiceRevision, options: WorkflowWriteOptions): Promise<Invoice>
    versions(id: string, signal: AbortSignal): Promise<readonly Invoice[]>
    get(id: string, signal: AbortSignal): Promise<Invoice>
    create(input: InvoiceInput, options: WorkflowWriteOptions): Promise<Invoice>
    update(
        id: string,
        input: InvoiceInput & WorkflowVersion & { revisionNumber: number },
        options: WorkflowWriteOptions,
    ): Promise<Invoice>
    issue(id: string, input: InvoiceVersion, options: WorkflowWriteOptions): Promise<Invoice>
    subscribe(listener: () => void): () => void
    list(query: InvoiceQuery, signal: AbortSignal): Promise<PageResponse<Invoice>>
}
