import { defineStore } from 'pinia'
import type { Invoice, InvoiceInput, InvoiceRevision } from '@/core/types/invoice'
export const useInvoiceRecoveryStore = defineStore('invoice-recovery', {
    state: (): {
        revision: {
            actorId: string
            invoice: Invoice
            draft: InvoiceRevision
            idempotencyKey: string
        } | null
        issue: { actorId: string; record: Invoice; idempotencyKey: string } | null
        snapshot: {
            actorId: string
            invoice?: Invoice
            draft: InvoiceInput
            idempotencyKey: string
        } | null
    } => ({ snapshot: null, issue: null, revision: null }),
})
