import { computed } from 'vue'
import type { ComputedRef } from 'vue'
import type { Order } from '@/core/types/order'
import type { Assignment, AssignmentInput } from '@/core/types/assignment'
import { useMasterForm } from '@/composables/useMasterForm'
import { useSessionStore } from '@/stores/session'
import { useAssignmentRecoveryStore } from '@/stores/assignment-recovery'
import { hasBusinessPermission, evaluateRecordAccess } from '@/core/domain/record-policy'
import { ApiError } from '@/core/types/api-error'
import { useAssignmentApi } from './useAssignmentApi'
export function useAssignmentForm(
    order: Order,
    assignment: Assignment | undefined,
    saved: () => void,
): ReturnType<typeof useMasterForm<AssignmentInput>> & {
    permitted: ComputedRef<boolean>
} {
    const api = useAssignmentApi()
    const store = useSessionStore()
    const recovery = useAssignmentRecoveryStore()
    const actorId = store.user?.id
    const candidate = recovery.snapshot
    const snapshot =
        candidate?.actorId === actorId &&
        candidate?.draft.orderId === order.id &&
        candidate?.assignment?.id === assignment?.id
            ? candidate
            : null
    const baseline = snapshot?.assignment ?? assignment
    recovery.$reset()
    const initial: AssignmentInput = {
        orderId: order.id,
        mitraId: baseline?.mitraId ?? '',
        graderId: baseline?.graderId ?? '',
        timberProductId: baseline?.timberProductId ?? '',
        quantity: baseline?.quantity ?? 1,
    }
    const permitted = computed(
        () =>
            store.user?.id === actorId &&
            ['draft', 'rejected'].includes(order.status) &&
            hasBusinessPermission(store.user, 'orders.update') &&
            (baseline
                ? evaluateRecordAccess(store.user, 'assignments.update', baseline) === 'allowed' &&
                  baseline.allowedActions.includes('update')
                : hasBusinessPermission(store.user, 'assignments.create')),
    )
    const form = useMasterForm<AssignmentInput>({
        resource: 'assignments',
        initial,
        snapshot,
        validate: (input) =>
            Object.fromEntries(
                Object.entries(input)
                    .filter(([key, value]) =>
                        key === 'quantity'
                            ? !Number.isSafeInteger(value) || Number(value) < 1
                            : !value,
                    )
                    .map(([key]) => [key, 'assignments.invalid']),
            ),
        write: async (input, signal, idempotencyKey) => {
            if (!permitted.value) throw new ApiError('forbidden')
            const options = {
                signal,
                idempotencyKey,
                snapshotGeneration: baseline?.snapshotGeneration ?? order.snapshotGeneration,
            }
            return baseline
                ? api.update(baseline.id, { ...input, version: baseline.version }, options)
                : api.create(input, options)
        },
        recover: (draft, idempotencyKey, id) => {
            recovery.snapshot = {
                actorId: id,
                assignment: baseline,
                draft: { ...draft },
                idempotencyKey,
            }
        },
        saved,
    })
    return { ...form, permitted }
}
