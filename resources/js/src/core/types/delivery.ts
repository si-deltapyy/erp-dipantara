import type { PageResponse, RecordMetadata } from './contracts'
import type { MasterListQuery } from './master-list'
import type { WorkflowWriteOptions } from './workflow'

export const deliveryStatuses = ['draft', 'dispatched', 'received'] as const
export type DeliveryStatus = (typeof deliveryStatuses)[number]
export interface DeliveryAllocation {
    readonly gradingId: string
    readonly rowId: string
    readonly quantity: number
}
export interface DeliveryDocument {
    readonly documentId: string
    readonly direction: 'farmer_to_company' | 'company_to_buyer'
    readonly number: string
    readonly documentDate: string
}
export interface DeliveryInput {
    readonly purchaseOrderId: string
    readonly deliveryDate: string
    readonly licensePlate: string
    readonly allocations: readonly DeliveryAllocation[]
    readonly documents: readonly DeliveryDocument[]
    readonly availabilityToken: string
}
export interface DeliveryContext extends DeliveryAllocation {
    readonly assignmentId: string
    readonly mitraName: string
    readonly timberProductName: string
}
export interface Delivery extends Omit<DeliveryInput, 'availabilityToken'>, RecordMetadata {
    readonly id: string
    readonly status: DeliveryStatus
    readonly purchaseOrderNumber: string
    readonly buyerName: string
    readonly allocationContext: readonly DeliveryContext[]
    readonly createdAt: string
    readonly updatedAt: string
    readonly snapshotGeneration?: string
}
export interface DeliveryQuery extends MasterListQuery {
    readonly purchaseOrderId?: string
    readonly assignmentId?: string
    readonly status?: DeliveryStatus
}
export interface AvailabilityQuery extends MasterListQuery {
    readonly purchaseOrderId: string
    readonly assignmentId?: string
    readonly excludeDeliveryId?: string
}
export interface AvailableTimber {
    readonly lineageIds: readonly string[]
    readonly gradingId: string
    readonly rowId: string
    readonly assignmentId: string
    readonly mitraName: string
    readonly timberProductName: string
    readonly approvedQuantity: number
    readonly reservedQuantity: number
    readonly shippedQuantity: number
    readonly availableQuantity: number
    readonly snapshotToken: string
}
export interface DeliveriesApi {
    list(query: DeliveryQuery, signal: AbortSignal): Promise<PageResponse<Delivery>>
    get(id: string, signal: AbortSignal): Promise<Delivery>
    availability(
        query: AvailabilityQuery,
        signal: AbortSignal,
    ): Promise<PageResponse<AvailableTimber>>
    create(input: DeliveryInput, options: WorkflowWriteOptions): Promise<Delivery>
    update(
        id: string,
        input: DeliveryInput & { version: number },
        options: WorkflowWriteOptions,
    ): Promise<Delivery>
    subscribe(listener: () => void): () => void
}
