import type { MasterListQuery } from './master-list'
import type { OpaqueId, PageResponse, RecordMetadata } from './contracts'

export interface BuyerInput {
    readonly companyName: string
    readonly contactName: string
    readonly phone: string
    readonly address: string
}
export interface BuyerRecord extends BuyerInput {
    readonly id: OpaqueId
    readonly createdAt: string
    readonly updatedAt: string
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
    list(query: BuyerQuery, signal: AbortSignal): Promise<readonly BuyerRecord[]>
    lookup(query: BuyerQuery, signal: AbortSignal): Promise<PageResponse<BuyerLookup>>
    get(id: string, signal: AbortSignal): Promise<BuyerRecord>
    create(input: BuyerInput, options: BuyerWriteOptions): Promise<BuyerRecord>
    update(id: string, input: BuyerInput, options: BuyerWriteOptions): Promise<BuyerRecord>
    subscribe(listener: () => void): () => void
}
