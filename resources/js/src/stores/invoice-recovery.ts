import { defineStore } from 'pinia'
import type { Invoice, InvoiceInput } from '@/core/types/invoice'
export const useInvoiceRecoveryStore = defineStore('invoice-recovery', {
    state: (): {
        issue: { actorId: string; record: Invoice; idempotencyKey: string } | null
        snapshot: {
            actorId: string
            invoice?: Invoice
            draft: InvoiceInput
            idempotencyKey: string
        } | null
    } => ({ snapshot: null, issue: null }),
})
