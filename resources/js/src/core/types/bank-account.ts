import type { MasterListQuery } from './master-list'
import type { OpaqueId, PageResponse, RecordMetadata } from './contracts'

export type BankAccountOwnerType = 'company' | 'buyer' | 'mitra'
export interface BankAccountInput {
    readonly bankName: string
    readonly accountNumber: string
    readonly accountHolder: string
    readonly ownerType: BankAccountOwnerType
    readonly ownerId: string | null
}
export interface BankAccountRecord {
    readonly id: OpaqueId
    readonly source: 'bank-account-numbers' | 'rekenings'
    readonly bankName: string
    readonly accountNumber: string
    readonly accountHolder: string
    readonly mitraId?: OpaqueId
    readonly createdAt: string
    readonly updatedAt: string
}
export interface BankAccount extends BankAccountInput, RecordMetadata {
    readonly snapshotGeneration?: string
    readonly id: OpaqueId
    readonly createdAt: string
    readonly updatedAt: string
}
export interface BankAccountUpdate extends BankAccountInput {
    readonly version: number
}
export interface BankAccountLookup {
    readonly id: OpaqueId
    readonly label: string
}
export interface BankAccountQuery extends MasterListQuery {
    readonly ownerType?: BankAccountOwnerType
    readonly ownerId?: string
    readonly invoiceId?: string
}
export interface BankAccountWriteOptions {
    readonly snapshotGeneration?: string
    readonly signal: AbortSignal
    readonly idempotencyKey: string
}
export interface BankAccountsApi {
    list(query: BankAccountQuery, signal: AbortSignal): Promise<readonly BankAccountRecord[]>
    lookup(query: BankAccountQuery, signal: AbortSignal): Promise<PageResponse<BankAccountLookup>>
    get(id: string, signal: AbortSignal): Promise<BankAccount>
    create(input: BankAccountInput, options: BankAccountWriteOptions): Promise<BankAccount>
    update(
        id: string,
        input: BankAccountUpdate,
        options: BankAccountWriteOptions,
    ): Promise<BankAccount>
    subscribe(listener: () => void): () => void
}
