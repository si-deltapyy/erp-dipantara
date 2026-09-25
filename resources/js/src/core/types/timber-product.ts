import type { MasterListQuery } from './master-list'
import type { OpaqueId, PageResponse, RecordMetadata } from './contracts'

export interface TimberSpecification {
    readonly name: string
    readonly gradeCode: string
    readonly diameterCm: string
    readonly lengthM: string
}
export interface TimberProductInput extends TimberSpecification {
    readonly purchasePrice: string
    readonly salePrice: string
}
export interface TimberProduct extends TimberSpecification, RecordMetadata {
    readonly id: OpaqueId
    readonly volumeM3: string
    readonly purchasePrice?: string
    readonly salePrice?: string
    readonly createdAt: string
    readonly updatedAt: string
    readonly snapshotGeneration?: string
}
export interface TimberProductUpdate extends TimberProductInput {
    readonly version: number
}
export interface TimberProductLookup {
    readonly id: OpaqueId
    readonly label: string
}
export type TimberProductQuery = MasterListQuery
export interface TimberProductWriteOptions {
    readonly signal: AbortSignal
    readonly idempotencyKey: string
    readonly snapshotGeneration?: string
}
export interface TimberProductsApi {
    readonly previewVolume?: (diameterCm: string, lengthM: string) => string | null
    list(query: TimberProductQuery, signal: AbortSignal): Promise<PageResponse<TimberProduct>>
    lookup(
        query: TimberProductQuery,
        signal: AbortSignal,
    ): Promise<PageResponse<TimberProductLookup>>
    get(id: string, signal: AbortSignal): Promise<TimberProduct>
    create(input: TimberProductInput, options: TimberProductWriteOptions): Promise<TimberProduct>
    update(
        id: string,
        input: TimberProductUpdate,
        options: TimberProductWriteOptions,
    ): Promise<TimberProduct>
    subscribe(listener: () => void): () => void
}
