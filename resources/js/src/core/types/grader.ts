import type { MasterListQuery } from './master-list'
import type { OpaqueId, PageResponse, RecordMetadata } from './contracts'

export interface GraderInput {
    readonly email: string
    readonly name: string
    readonly phone: string
    readonly address: string
}
export type GraderProvisioningStatus = 'not_provisioned' | 'pending_activation' | 'active'
export interface GraderProvisionInput {
    readonly version: number
}
export interface Grader extends GraderInput, RecordMetadata {
    readonly provisioningStatus: GraderProvisioningStatus
    readonly userId: OpaqueId | null
    readonly snapshotGeneration?: string
    readonly id: OpaqueId
    readonly createdAt: string
    readonly updatedAt: string
}
export interface GraderUpdate extends GraderInput {
    readonly version: number
}
export interface GraderLookup {
    readonly id: OpaqueId
    readonly label: string
}
export type GraderQuery = MasterListQuery
export interface GraderWriteOptions {
    readonly snapshotGeneration?: string
    readonly signal: AbortSignal
    readonly idempotencyKey: string
}
export interface GradersApi {
    list(query: GraderQuery, signal: AbortSignal): Promise<PageResponse<Grader>>
    lookup(query: GraderQuery, signal: AbortSignal): Promise<PageResponse<GraderLookup>>
    get(id: string, signal: AbortSignal): Promise<Grader>
    create(input: GraderInput, options: GraderWriteOptions): Promise<Grader>
    update(id: string, input: GraderUpdate, options: GraderWriteOptions): Promise<Grader>
    provision(id: string, input: GraderProvisionInput, options: GraderWriteOptions): Promise<Grader>
    subscribe(listener: () => void): () => void
}
