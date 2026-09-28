import type { Payment } from '@/core/types/payment'
import type { Invoice } from '@/core/types/invoice'
import type { Delivery } from '@/core/types/delivery'
import type { Grading } from '@/core/types/grading'
import type { Assignment } from '@/core/types/assignment'
import type { Order } from '@/core/types/order'
import type { DocumentAudit, DocumentReceipt, StoredDocument } from './document-schema'
import type { PurchaseOrder } from '@/core/types/purchase-order'
import type { Grader } from '@/core/types/grader'
import type { BankAccount } from '@/core/types/bank-account'
import type { TimberProduct } from '@/core/types/timber-product'
import type { Mitra } from '@/core/types/mitra'
import type { Buyer } from '@/core/types/buyer'

export const demoStores = [
    'payments',
    'paymentMutations',
    'invoiceVersions',
    'invoices',
    'invoiceMutations',
    'deliveries',
    'deliveryMutations',
    'gradings',
    'gradingMutations',
    'assignments',
    'assignmentMutations',
    'orders',
    'orderMutations',
    'documents',
    'documentMutations',
    'purchase-orders',
    'purchaseOrderMutations',
    'graders',
    'graderMutations',
    'bank-accounts',
    'bankAccountMutations',
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
export const demoSchemaVersion = 15
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
    readonly payments: Payment
    readonly paymentMutations: {
        readonly id: string
        readonly payloadHash: string
        readonly expiresAt: number
        readonly result: Payment
    }
    readonly invoiceVersions: {
        readonly id: string
        readonly invoiceId: string
        readonly invoice: Invoice
    }
    readonly invoices: Invoice
    readonly invoiceMutations: InvoiceMutationReceipt
    readonly deliveries: Delivery
    readonly deliveryMutations: DeliveryMutationReceipt
    readonly gradings: Grading
    readonly gradingMutations: GradingMutationReceipt
    readonly assignments: Assignment
    readonly assignmentMutations: AssignmentMutationReceipt
    readonly orders: Order
    readonly orderMutations: OrderMutationReceipt
    readonly documents: StoredDocument
    readonly documentMutations: DocumentReceipt
    readonly 'purchase-orders': PurchaseOrder
    readonly purchaseOrderMutations: PurchaseOrderMutationReceipt
    readonly graders: Grader
    readonly graderMutations: GraderMutationReceipt
    readonly 'bank-accounts': BankAccount
    readonly bankAccountMutations: BankAccountMutationReceipt
    readonly 'timber-products': TimberProduct
    readonly timberProductMutations: TimberProductMutationReceipt
    readonly mitras: Mitra
    readonly mitraMutations: MitraMutationReceipt
    readonly buyers: Buyer
    readonly buyerMutations: BuyerMutationReceipt
    readonly metadata: DatasetMetadata
    readonly samples: DemoSample
    readonly audit:
        DemoAudit | MasterDataAudit | PurchaseOrderAudit | DocumentAudit | OrderAudit | GradingAudit
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
    readonly resource: 'graders' | 'bank-accounts' | 'buyers' | 'mitras' | 'timber-products'
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

export interface BankAccountMutationReceipt {
    readonly id: string
    readonly payloadHash: string
    readonly expiresAt: number
    readonly result: BankAccount
}

export interface GraderMutationReceipt {
    readonly id: string
    readonly payloadHash: string
    readonly expiresAt: number
    readonly result: Grader
}

export interface PurchaseOrderMutationReceipt {
    readonly id: string
    readonly payloadHash: string
    readonly expiresAt: number
    readonly result: PurchaseOrder
}
export interface PurchaseOrderAudit {
    readonly id: string
    readonly resource: 'purchase-orders'
    readonly recordId: string
    readonly actorId: string
    readonly version: number
    readonly action: 'create' | 'update' | 'submit' | 'approve' | 'reject'
    readonly reason?: string
}

export interface OrderMutationReceipt {
    readonly id: string
    readonly payloadHash: string
    readonly expiresAt: number
    readonly result: Order
}
export interface OrderAudit {
    readonly id: string
    readonly resource: 'orders' | 'assignments' | 'deliveries' | 'invoices' | 'payments'
    readonly recordId: string
    readonly actorId: string
    readonly version: number
    readonly action: string
}

export interface AssignmentMutationReceipt {
    readonly id: string
    readonly payloadHash: string
    readonly expiresAt: number
    readonly result: Assignment
}

export interface GradingMutationReceipt {
    readonly id: string
    readonly payloadHash: string
    readonly expiresAt: number
    readonly result: Grading
}
export interface GradingAudit {
    readonly id: string
    readonly resource: 'gradings'
    readonly recordId: string
    readonly actorId: string
    readonly version: number
    readonly action: string
    readonly reason?: string
}

export interface DeliveryMutationReceipt {
    readonly id: string
    readonly payloadHash: string
    readonly expiresAt: number
    readonly result: Delivery
}

export interface InvoiceMutationReceipt {
    readonly id: string
    readonly payloadHash: string
    readonly expiresAt: number
    readonly result: Invoice
}
