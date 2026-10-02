declare const valueBrand: unique symbol
export type OpaqueId = string & { readonly [valueBrand]: 'id' }
export type DecimalString = string & { readonly [valueBrand]: 'decimal' }
export type MoneyString = string & { readonly [valueBrand]: 'money' }
export interface PageMeta {
    readonly page: number
    readonly perPage: number
    readonly total: number
}
export interface DetailResponse<T> {
    readonly data: T
}
export interface PageResponse<T> extends DetailResponse<readonly T[]> {
    readonly meta: PageMeta
}
export interface RecordMetadata {
    readonly version: number
    readonly createdByUserId: OpaqueId
    readonly submittedByUserId: OpaqueId | null
    readonly allowedActions: readonly string[]
}
export interface ErrorEnvelope {
    readonly message: string
    readonly code: string
    readonly errors?: Readonly<Record<string, readonly string[]>>
    readonly requestId?: string
}
