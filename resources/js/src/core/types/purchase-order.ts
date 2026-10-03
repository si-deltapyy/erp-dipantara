import type { PageResponse, RecordMetadata } from './contracts'
import type { MasterListQuery } from './master-list'

export const purchaseOrderStatuses = [
    'draft',
    'submitted',
    'approved',
    'rejected',
    'closed',
] as const
export type PurchaseOrderStatus = (typeof purchaseOrderStatuses)[number]
export interface PurchaseOrderLineInput {
    readonly timberProductId: string
    readonly quantity: number
    readonly unitPrice: string
}
export interface PurchaseOrderInput {
    readonly buyerId: string
    readonly number: string
    readonly orderDate: string
    readonly lines: readonly PurchaseOrderLineInput[]
    readonly notes: string | null
}
export interface PurchaseOrder extends PurchaseOrderInput, RecordMetadata {
    readonly id: string
    readonly buyerName: string
    readonly lines: readonly (PurchaseOrderLineInput & { readonly timberProductName: string })[]
    readonly status: PurchaseOrderStatus
    readonly rejectionReason: string | null
    readonly totalAmount: string
    readonly createdAt: string
    readonly updatedAt: string
    readonly snapshotGeneration?: string
}
export interface PurchaseOrderUpdate extends PurchaseOrderInput {
    readonly version: number
}
export interface PurchaseOrderRejection {
    readonly version: number
    readonly reason: string
}
export type PurchaseOrderReviewAction = 'approve' | 'reject'
export interface PurchaseOrderQuery extends MasterListQuery {
    readonly buyerId?: string
    readonly mitraId?: string
    readonly graderId?: string
    readonly status?: PurchaseOrderStatus
}
export interface PurchaseOrderWriteOptions {
    readonly signal: AbortSignal
    readonly idempotencyKey: string
    readonly snapshotGeneration?: string
}
export interface PurchaseOrderRecord {
    readonly id: string
    readonly number: string
    readonly buyerName: string | null
    readonly productName: string | null
    readonly orderDate: string
    readonly closingDate: string
    readonly quantity: number
    readonly totalAmount: string | null
    readonly status: 'pending' | 'on_process' | 'delivered' | 'completed'
}
export interface PurchaseOrdersApi {
    list(query: PurchaseOrderQuery, signal: AbortSignal): Promise<PageResponse<PurchaseOrderRecord>>
    get(id: string, signal: AbortSignal): Promise<PurchaseOrder>
    create(input: PurchaseOrderInput, options: PurchaseOrderWriteOptions): Promise<PurchaseOrder>
    update(
        id: string,
        input: PurchaseOrderUpdate,
        options: PurchaseOrderWriteOptions,
    ): Promise<PurchaseOrder>
    submit(
        id: string,
        input: { readonly version: number },
        options: PurchaseOrderWriteOptions,
    ): Promise<PurchaseOrder>
    approve(
        id: string,
        input: { readonly version: number },
        options: PurchaseOrderWriteOptions,
    ): Promise<PurchaseOrder>
    reject(
        id: string,
        input: PurchaseOrderRejection,
        options: PurchaseOrderWriteOptions,
    ): Promise<PurchaseOrder>
    subscribe(listener: () => void): () => void
}
