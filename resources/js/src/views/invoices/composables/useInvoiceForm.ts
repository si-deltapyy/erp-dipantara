import type { ComputedRef } from 'vue'
import { computed } from 'vue'
import type { Invoice, InvoiceInput } from '@/core/types/invoice'
import { invoiceDraft, validateInvoice } from '@/core/domain/invoice-draft'
import { useMasterForm } from '@/composables/useMasterForm'
import { useSessionStore } from '@/stores/session'
import { useInvoiceRecoveryStore } from '@/stores/invoice-recovery'
import { useInvoiceApi } from './useInvoiceApi'
import { canActOnInvoice, canCreateInvoice } from '@/core/domain/invoice-policy'
import { ApiError } from '@/core/types/api-error'
type InvoiceFormState = ReturnType<typeof useMasterForm<InvoiceInput>> & {
    permitted: ComputedRef<boolean>
}
export function useInvoiceForm(
    invoice: Invoice | undefined,
    saved: (invoice: Invoice) => void,
): InvoiceFormState {
    const api = useInvoiceApi()
    const store = useSessionStore()
    const recovery = useInvoiceRecoveryStore()
    const actorId = store.user?.id
    const candidate = recovery.snapshot
    const snapshot =
        candidate && candidate.actorId === actorId && candidate.invoice?.id === invoice?.id
            ? candidate
            : null
    const baseline = snapshot?.invoice ?? invoice
    recovery.$reset()
    let completed: Invoice | undefined
    const permitted = computed(
        () =>
            store.user?.id === actorId &&
            (baseline
                ? canActOnInvoice(store.user, baseline, 'update')
                : canCreateInvoice(store.user)),
    )
    const form = useMasterForm<InvoiceInput>({
        resource: 'invoices',
        initial: invoiceDraft(baseline),
        snapshot,
        validate: validateInvoice,
        write: async (draft, signal, idempotencyKey) => {
            if (!permitted.value) throw new ApiError('forbidden')
            const options = {
                signal,
                idempotencyKey,
                snapshotGeneration: baseline?.snapshotGeneration,
            }
            completed = baseline
                ? await api.update(
                      baseline.id,
                      {
                          ...draft,
                          version: baseline.version,
                          revisionNumber: baseline.revisionNumber,
                      },
                      options,
                  )
                : await api.create(draft, options)
        },
        recover: (draft, idempotencyKey, actorId) => {
            recovery.snapshot = { actorId, invoice: baseline, draft, idempotencyKey }
        },
        saved: () => {
            if (completed) saved(completed)
        },
    })
    return { ...form, permitted }
}
