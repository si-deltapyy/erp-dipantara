import { inject } from 'vue'
import { buyersApiKey } from '@/api/buyers-api'
import type { Buyer, BuyerInput } from '@/core/types/buyer'
import { buyerDraft, emptyBuyer, validateBuyer } from '@/core/domain/buyer-validation'
import { useSessionStore } from '@/stores/session'
import { useBuyerRecoveryStore } from '@/stores/buyer-recovery'
import { useMasterForm } from '@/composables/useMasterForm'

export function useBuyerForm(
    buyer: Buyer | undefined,
    saved: () => void,
): ReturnType<typeof useMasterForm<BuyerInput>> {
    const api = inject(buyersApiKey)
    if (!api) throw new Error('Buyers API is not configured')
    const store = useSessionStore()
    const recovery = useBuyerRecoveryStore()
    const snapshot = recovery.snapshot?.actorId === store.user?.id ? recovery.snapshot : null
    recovery.$reset()
    return useMasterForm<BuyerInput>({
        resource: 'buyers',
        initial: buyer ? buyerDraft(buyer) : emptyBuyer(),
        snapshot,
        validate: validateBuyer,
        write: (draft, signal, idempotencyKey) => {
            const options = {
                signal,
                idempotencyKey,
                snapshotGeneration: buyer?.snapshotGeneration,
            }
            return buyer
                ? api.update(buyer.id, { ...draft, version: buyer.version }, options)
                : api.create(draft, options)
        },
        recover: (draft, idempotencyKey, actorId) => {
            recovery.snapshot = { actorId, buyer, draft, idempotencyKey }
        },
        saved,
    })
}
