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
    readonly totalAmount: string
    readonly createdAt: string
    readonly updatedAt: string
    readonly snapshotGeneration?: string
}
export interface PurchaseOrderUpdate extends PurchaseOrderInput {
    readonly version: number
}
export interface PurchaseOrderQuery extends MasterListQuery {
    readonly buyerId?: string
    readonly status?: PurchaseOrderStatus
}
export interface PurchaseOrderWriteOptions {
    readonly signal: AbortSignal
    readonly idempotencyKey: string
    readonly snapshotGeneration?: string
}
export interface PurchaseOrdersApi {
    list(query: PurchaseOrderQuery, signal: AbortSignal): Promise<PageResponse<PurchaseOrder>>
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
    subscribe(listener: () => void): () => void
}
