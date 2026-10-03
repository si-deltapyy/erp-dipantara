import { inject } from 'vue'
import { timberProductsApiKey } from '@/api/timber-products-api'
import type { TimberProductCreateInput } from '@/core/types/timber-product'
import {
    emptyTimberProductCreate,
    validateTimberProductCreate,
} from '@/core/domain/timber-product-validation'
import { ApiError } from '@/core/types/api-error'
import { useSessionStore } from '@/stores/session'
import { useTimberProductRecoveryStore } from '@/stores/timber-product-recovery'
import { useMasterForm } from '@/composables/useMasterForm'

export function useTimberProductForm(
    saved: () => void,
): ReturnType<typeof useMasterForm<TimberProductCreateInput>> {
    const api = inject(timberProductsApiKey)
    if (!api) throw new Error('TimberProducts API is not configured')
    const store = useSessionStore()
    const recovery = useTimberProductRecoveryStore()
    const snapshot = recovery.snapshot?.actorId === store.user?.id ? recovery.snapshot : null
    recovery.$reset()
    return useMasterForm<TimberProductCreateInput>({
        resource: 'timber-products',
        retrySafe: false,
        requiredPermission: 'timber-products.create.all',
        initial: emptyTimberProductCreate(),
        snapshot,
        validate: validateTimberProductCreate,
        write: (draft, signal, idempotencyKey) => {
            if (!store.user?.permissions.includes('timber-prices.read.all'))
                throw new ApiError('forbidden')
            return api.create(draft, { signal, idempotencyKey })
        },
        recover: (draft, idempotencyKey, actorId) => {
            recovery.snapshot = { actorId, draft, idempotencyKey }
        },
        saved,
    })
}
