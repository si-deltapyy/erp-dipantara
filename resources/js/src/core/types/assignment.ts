import type { PageResponse, RecordMetadata } from './contracts'
import type { MasterListQuery } from './master-list'
import type { OrderStatus, OrderWriteOptions } from './order'
export interface AssignmentInput {
    readonly orderId: string
    readonly mitraId: string
    readonly graderId: string
    readonly timberProductId: string
    readonly quantity: number
}
export interface Assignment extends AssignmentInput, RecordMetadata {
    readonly id: string
    readonly graderUserId: string
    readonly purchaseOrderNumber: string
    readonly mitraName: string
    readonly graderName: string
    readonly timberProductName: string
    readonly orderStatus: OrderStatus
    readonly gradingReference: {
        readonly timberProductId: string
        readonly timberProductName: string
        readonly gradeCodes: readonly string[]
    }
    readonly createdAt: string
    readonly updatedAt: string
    readonly snapshotGeneration?: string
}
export interface AssignmentQuery extends MasterListQuery {
    readonly orderId?: string
    readonly mitraId?: string
    readonly graderId?: string
}
export interface AssignmentsApi {
    list(query: AssignmentQuery, signal: AbortSignal): Promise<PageResponse<Assignment>>
    get(id: string, signal: AbortSignal): Promise<Assignment>
    create(input: AssignmentInput, options: OrderWriteOptions): Promise<Assignment>
    update(
        id: string,
        input: AssignmentInput & { readonly version: number },
        options: OrderWriteOptions,
    ): Promise<Assignment>
    subscribe(listener: () => void): () => void
}
