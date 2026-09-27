import type { PageResponse, RecordMetadata } from './contracts'
import type { MasterListQuery } from './master-list'
import type { PurchaseOrderWriteOptions } from './purchase-order'
export const orderStatuses = ['draft', 'submitted', 'approved', 'rejected'] as const
export type OrderStatus = (typeof orderStatuses)[number]
export interface OrderInput {
    readonly purchaseOrderId: string
    readonly notes: string | null
}
export interface Order extends OrderInput, RecordMetadata {
    readonly id: string
    readonly status: OrderStatus
    readonly purchaseOrderNumber: string
    readonly buyerName: string
    readonly rejectionReason: string | null
    readonly createdAt: string
    readonly updatedAt: string
    readonly snapshotGeneration?: string
}
export interface OrderQuery extends MasterListQuery {
    readonly purchaseOrderId?: string
    readonly status?: OrderStatus
}
export type OrderWriteOptions = PurchaseOrderWriteOptions
export interface OrdersApi {
    list(query: OrderQuery, signal: AbortSignal): Promise<PageResponse<Order>>
    get(id: string, signal: AbortSignal): Promise<Order>
    create(input: OrderInput, options: OrderWriteOptions): Promise<Order>
    update(
        id: string,
        input: OrderInput & { readonly version: number },
        options: OrderWriteOptions,
    ): Promise<Order>
    subscribe(listener: () => void): () => void
}
