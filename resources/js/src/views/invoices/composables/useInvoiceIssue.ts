import type { Ref } from 'vue'
import type { Invoice } from '@/core/types/invoice'
import { useRecordSubmit } from '@/composables/useRecordSubmit'
import { useInvoiceRecoveryStore } from '@/stores/invoice-recovery'
import { canActOnInvoice } from '@/core/domain/invoice-policy'
import { useInvoiceApi } from './useInvoiceApi'
export function useInvoiceIssue(
    invoice: Ref<Invoice | undefined>,
): ReturnType<typeof useRecordSubmit<Invoice>> {
    const recovery = useInvoiceRecoveryStore()
    const api = useInvoiceApi()
    return useRecordSubmit(invoice, {
        resource: 'invoices',
        api: {
            submit: (id, input, options) =>
                api.issue(
                    id,
                    { ...input, revisionNumber: invoice.value?.revisionNumber ?? 0 },
                    options,
                ),
        },
        canAct: (actor, invoice) => canActOnInvoice(actor, invoice, 'issue'),
        snapshot: () => recovery.issue,
        recover: (record, idempotencyKey, actorId) => {
            recovery.issue = { record, idempotencyKey, actorId }
        },
        clear: () => {
            recovery.issue = null
        },
    })
}
