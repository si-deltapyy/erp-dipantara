import { computed, shallowRef } from 'vue'
import type { ComputedRef } from 'vue'
import type { GradingCreateInput } from '@/core/types/grading'
import { emptyGradingCreate, validateGradingCreate } from '@/core/domain/grading-draft'
import { useMasterForm } from '@/composables/useMasterForm'
import { useSessionStore } from '@/stores/session'
import { useGradingRecoveryStore } from '@/stores/grading-recovery'
import { useGradingApi } from './useGradingApi'
import { ApiError } from '@/core/types/api-error'
export function useGradingForm(
    saved: (grading: { readonly id: string }) => void,
): ReturnType<typeof useMasterForm<GradingCreateInput>> & { permitted: ComputedRef<boolean> } {
    const api = useGradingApi()
    const store = useSessionStore()
    const recovery = useGradingRecoveryStore()
    const snapshot = recovery.snapshot?.actorId === store.user?.id ? recovery.snapshot : null
    recovery.$reset()
    const completed = shallowRef<{ readonly id: string }>()
    const permitted = computed(() =>
        [
            'gradings.read.all',
            'gradings.create.all',
            'purchase-orders.read.all',
            'mitras.read.all',
            'graders.read.all',
            'timber-products.read.all',
            'timber-prices.read.all',
        ].every((permission) => store.user?.permissions.includes(permission)),
    )
    const form = useMasterForm<GradingCreateInput>({
        resource: 'gradings',
        retrySafe: false,
        initial: emptyGradingCreate(),
        snapshot,
        validate: validateGradingCreate,
        write: async (draft, signal, idempotencyKey) => {
            if (!permitted.value) throw new ApiError('forbidden')
            completed.value = await api.create(draft, { signal, idempotencyKey })
        },
        recover: (draft, idempotencyKey, actorId) => {
            recovery.snapshot = { actorId, draft, idempotencyKey }
        },
        saved: () => {
            if (completed.value) saved(completed.value)
        },
    })
    return { ...form, permitted }
}
