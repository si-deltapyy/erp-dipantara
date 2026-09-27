import type { MasterListQuery } from './master-list'
import type { OpaqueId, PageResponse, RecordMetadata } from './contracts'

export interface BuyerInput {
    readonly companyName: string
    readonly contactName: string
    readonly phone: string
    readonly address: string
}
export interface Buyer extends BuyerInput, RecordMetadata {
    readonly snapshotGeneration?: string
    readonly id: OpaqueId
    readonly createdAt: string
    readonly updatedAt: string
}
export interface BuyerUpdate extends BuyerInput {
    readonly version: number
}
export interface BuyerLookup {
    readonly id: OpaqueId
    readonly label: string
}
export type BuyerQuery = MasterListQuery
export interface BuyerWriteOptions {
    readonly snapshotGeneration?: string
    readonly signal: AbortSignal
    readonly idempotencyKey: string
}
export interface BuyersApi {
    list(query: BuyerQuery, signal: AbortSignal): Promise<PageResponse<Buyer>>
    lookup(query: BuyerQuery, signal: AbortSignal): Promise<PageResponse<BuyerLookup>>
    get(id: string, signal: AbortSignal): Promise<Buyer>
    create(input: BuyerInput, options: BuyerWriteOptions): Promise<Buyer>
    update(id: string, input: BuyerUpdate, options: BuyerWriteOptions): Promise<Buyer>
    subscribe(listener: () => void): () => void
}
