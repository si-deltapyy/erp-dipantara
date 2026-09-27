import type { PageResponse, RecordMetadata } from './contracts'
import type { MasterListQuery } from './master-list'
export interface InvoiceTerm {
    readonly label: string
    readonly amount: string
    readonly dueDate: string | null
}
export interface Invoice extends RecordMetadata {
    readonly id: string
    readonly purchaseOrderId: string
    readonly mitraId: string | null
    readonly direction: 'receivable' | 'payable'
    readonly kind: 'down_payment' | 'settlement'
    readonly invoiceDate: string
    readonly terms: readonly InvoiceTerm[]
    readonly notes: string | null
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
    readonly purchaseOrderId?: string
    readonly mitraId?: string
    readonly direction?: 'receivable' | 'payable'
}
export interface InvoicesApi {
    list(query: InvoiceQuery, signal: AbortSignal): Promise<PageResponse<Invoice>>
}
