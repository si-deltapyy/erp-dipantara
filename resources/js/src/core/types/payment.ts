import type { RecordMetadata } from './contracts'
import type { MasterListQuery } from './master-list'
import type { WorkflowVersion, WorkflowWriteOptions, WorkflowRejection } from './workflow'
export interface PaymentInput {
    readonly invoiceId: string
    readonly paymentDate: string
    readonly sourceAccountId: string
    readonly destinationAccountId: string
    readonly cashAmount: string
    readonly withholdingAmount: string
    readonly roundingAdjustment: string
    readonly proofDocumentId: string
    readonly notes: string | null
}
export interface Payment extends PaymentInput, RecordMetadata {
    readonly id: string
    readonly ownerUserId: string
    readonly purchaseOrderId: string
    readonly purchaseOrderNumber: string
    readonly invoiceNumber: string
    readonly counterpartyName: string
    readonly direction: 'receivable' | 'payable'
    readonly sourceAccountLabel: string
    readonly destinationAccountLabel: string
    readonly creditAmount: string
    readonly rejectionReason: string | null
    readonly status: 'draft' | 'submitted' | 'approved' | 'rejected'
    readonly createdAt: string
    readonly updatedAt: string
    readonly snapshotGeneration?: string
}
export interface PaymentQuery extends MasterListQuery {
    readonly invoiceId?: string
    readonly purchaseOrderId?: string
    readonly direction?: Payment['direction']
    readonly status?: Payment['status']
}
export interface PaymentsApi {
    list(query: PaymentQuery, signal: AbortSignal): Promise<readonly Payment[]>
    get(id: string, signal: AbortSignal): Promise<Payment>
    create(input: PaymentInput, options: WorkflowWriteOptions): Promise<Payment>
    update(
        id: string,
        input: PaymentInput & WorkflowVersion,
        options: WorkflowWriteOptions,
    ): Promise<Payment>
    submit(id: string, input: WorkflowVersion, options: WorkflowWriteOptions): Promise<Payment>
    approve(id: string, input: WorkflowVersion, options: WorkflowWriteOptions): Promise<Payment>
    reject(id: string, input: WorkflowRejection, options: WorkflowWriteOptions): Promise<Payment>
    subscribe(listener: () => void): () => void
}
