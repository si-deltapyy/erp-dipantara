import { inject } from 'vue'
import { timberProductsApiKey } from '@/api/timber-products-api'
import type { TimberProduct, TimberProductInput } from '@/core/types/timber-product'
import {
    timberProductDraft,
    emptyTimberProduct,
    validateTimberProduct,
    normalizeTimberInput,
} from '@/core/domain/timber-product-validation'
import { useSessionStore } from '@/stores/session'
import { useTimberProductRecoveryStore } from '@/stores/timber-product-recovery'
import { useMasterForm } from '@/composables/useMasterForm'

export function useTimberProductForm(
    timberProduct: TimberProduct | undefined,
    saved: () => void,
): ReturnType<typeof useMasterForm<TimberProductInput>> {
    const api = inject(timberProductsApiKey)
    if (!api) throw new Error('TimberProducts API is not configured')
    const store = useSessionStore()
    const recovery = useTimberProductRecoveryStore()
    const snapshot = recovery.snapshot?.actorId === store.user?.id ? recovery.snapshot : null
    recovery.$reset()
    return useMasterForm<TimberProductInput>({
        resource: 'timber-products',
        initial: timberProduct ? timberProductDraft(timberProduct) : emptyTimberProduct(),
        snapshot,
        validate: validateTimberProduct,
        write: (draft, signal, idempotencyKey) => {
            const options = {
                signal,
                idempotencyKey,
                snapshotGeneration: timberProduct?.snapshotGeneration,
            }
            return timberProduct
                ? api.update(
                      timberProduct.id,
                      { ...normalizeTimberInput(draft), version: timberProduct.version },
                      options,
                  )
                : api.create(normalizeTimberInput(draft), options)
        },
        recover: (draft, idempotencyKey, actorId) => {
            recovery.snapshot = { actorId, timberProduct, draft, idempotencyKey }
        },
        saved,
    })
}
