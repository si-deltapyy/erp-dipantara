import type { TimberProduct } from '@/core/types/timber-product'
import type { Mitra } from '@/core/types/mitra'
import type { Buyer } from '@/core/types/buyer'

export const demoStores = [
    'metadata',
    'samples',
    'audit',
    'blobs',
    'mutations',
    'buyers',
    'buyerMutations',
    'mitras',
    'mitraMutations',
    'timber-products',
    'timberProductMutations',
] as const
export type DemoStore = (typeof demoStores)[number]
export const demoSchemaVersion = 4
export const demoDatasetVersion = 1
export interface DatasetMetadata {
    readonly id: 'dataset'
    readonly datasetVersion: number
    readonly generation: string
    readonly revision: number
}
export interface DemoSample {
    readonly id: string
    readonly label: string
    readonly createdByUserId: string
    readonly submittedByUserId: string | null
    readonly graderUserId: string
    readonly version: number
    readonly quantity: number
}
export interface DemoAudit {
    readonly id: string
    readonly sampleId: string
    readonly actorId: string
    readonly version: number
}
export interface DemoBlob {
    readonly id: string
    readonly sampleId: string
    readonly fileName: string
    readonly content: Blob
}
export interface MutationReceipt {
    readonly id: string
    readonly payloadHash: string
    readonly expiresAt: number
    readonly result: DemoSample
}
export interface DemoTables {
    readonly 'timber-products': TimberProduct
    readonly timberProductMutations: TimberProductMutationReceipt
    readonly mitras: Mitra
    readonly mitraMutations: MitraMutationReceipt
    readonly buyers: Buyer
    readonly buyerMutations: BuyerMutationReceipt
    readonly metadata: DatasetMetadata
    readonly samples: DemoSample
    readonly audit: DemoAudit | MasterDataAudit
    readonly blobs: DemoBlob
    readonly mutations: MutationReceipt
}
export interface BuyerMutationReceipt {
    readonly id: string
    readonly payloadHash: string
    readonly expiresAt: number
    readonly result: Buyer
}

export interface MasterDataAudit {
    readonly id: string
    readonly resource: 'buyers' | 'mitras' | 'timber-products'
    readonly recordId: string
    readonly actorId: string
    readonly version: number
}

export interface MitraMutationReceipt {
    readonly id: string
    readonly payloadHash: string
    readonly expiresAt: number
    readonly result: Mitra
}

export interface TimberProductMutationReceipt {
    readonly id: string
    readonly payloadHash: string
    readonly expiresAt: number
    readonly result: TimberProduct
}
