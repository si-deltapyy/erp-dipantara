import type { MasterListQuery } from './master-list'
import type { OpaqueId, PageResponse, RecordMetadata } from './contracts'

export interface MitraInput {
    readonly name: string
    readonly phone: string
    readonly address: string
}
export interface Mitra extends MitraInput, RecordMetadata {
    readonly snapshotGeneration?: string
    readonly id: OpaqueId
    readonly createdAt: string
    readonly updatedAt: string
}
export interface MitraUpdate extends MitraInput {
    readonly version: number
}
export interface MitraLookup {
    readonly id: OpaqueId
    readonly label: string
}
export type MitraQuery = MasterListQuery
export interface MitraWriteOptions {
    readonly snapshotGeneration?: string
    readonly signal: AbortSignal
    readonly idempotencyKey: string
}
export interface MitrasApi {
    list(query: MitraQuery, signal: AbortSignal): Promise<PageResponse<Mitra>>
    lookup(query: MitraQuery, signal: AbortSignal): Promise<PageResponse<MitraLookup>>
    get(id: string, signal: AbortSignal): Promise<Mitra>
    create(input: MitraInput, options: MitraWriteOptions): Promise<Mitra>
    update(id: string, input: MitraUpdate, options: MitraWriteOptions): Promise<Mitra>
    subscribe(listener: () => void): () => void
}
