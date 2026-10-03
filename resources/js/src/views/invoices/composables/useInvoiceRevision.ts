import { computed } from 'vue'
import type { ComputedRef } from 'vue'
import type { Invoice, InvoiceRevision } from '@/core/types/invoice'
import { useInvoiceApi } from './useInvoiceApi'
import { useMasterForm } from '@/composables/useMasterForm'
import { useInvoiceRecoveryStore } from '@/stores/invoice-recovery'
import { useSessionStore } from '@/stores/session'
import { canActOnInvoice } from '@/core/domain/invoice-policy'
import { validateInvoice } from '@/core/domain/invoice-draft'
import { ApiError } from '@/core/types/api-error'
export function useInvoiceRevision(
    invoice: Invoice,
    saved: (invoice: Invoice) => void,
): ReturnType<typeof useMasterForm<InvoiceRevision>> & { permitted: ComputedRef<boolean> } {
    const api = useInvoiceApi()
    const recovery = useInvoiceRecoveryStore()
    const session = useSessionStore()
    const actorId = session.user?.id
    const candidate = recovery.revision
    const snapshot =
        candidate?.actorId === actorId && candidate?.invoice.id === invoice.id ? candidate : null
    const baseline = snapshot?.invoice ?? invoice
    recovery.revision = null
    const permitted = computed(
        () => session.user?.id === actorId && canActOnInvoice(session.user, baseline, 'revise'),
    )
    let completed: Invoice | undefined
    const form = useMasterForm<InvoiceRevision>({
        resource: 'invoices',
        snapshot,
        initial: {
            version: baseline.version,
            reason: '',
            terms: baseline.terms.map((term) => ({ ...term })),
        },
        validate: (draft) => ({
            ...(!draft.reason.trim() ? { reason: 'invoices.required' } : {}),
            ...([...draft.reason].length > 255 ? { reason: 'ui.validation.textLength' } : {}),
            ...Object.fromEntries(
                Object.entries(validateInvoice({ ...baseline, terms: draft.terms })).filter(
                    ([field]) => field === 'terms' || field.startsWith('terms.'),
                ),
            ),
        }),
        write: async (draft, signal, idempotencyKey) => {
            if (!permitted.value) throw new ApiError('forbidden')
            completed = await api.revise(baseline.id, draft, {
                signal,
                idempotencyKey,
                snapshotGeneration: baseline.snapshotGeneration,
            })
        },
        recover: (draft, idempotencyKey, actorId) => {
            recovery.revision = { invoice: baseline, draft, idempotencyKey, actorId }
        },
        saved: () => {
            if (completed) saved(completed)
        },
    })
    return { ...form, permitted }
}
