import { computed, shallowRef } from 'vue'
import type { ComputedRef, ShallowRef } from 'vue'
import type { Grading, GradingInput } from '@/core/types/grading'
import type { Assignment } from '@/core/types/assignment'
import { gradingDraft, validateGrading } from '@/core/domain/grading-draft'
import { canActOnGrading } from '@/core/domain/grading-policy'
import { evaluateRecordAccess } from '@/core/domain/record-policy'
import { useMasterForm } from '@/composables/useMasterForm'
import { useSessionStore } from '@/stores/session'
import { useGradingRecoveryStore } from '@/stores/grading-recovery'
import { useGradingApi } from './useGradingApi'
import { ApiError } from '@/core/types/api-error'
type GradingFormState = ReturnType<typeof useMasterForm<GradingInput>> & {
    permitted: ComputedRef<boolean>
    completed: ShallowRef<Grading | undefined>
}
export function useGradingForm(
    grading: Grading | undefined,
    assignment: Assignment,
    saved: (grading: Grading) => void,
): GradingFormState {
    const api = useGradingApi()
    const store = useSessionStore()
    const recovery = useGradingRecoveryStore()
    const actorId = store.user?.id
    const candidate = recovery.snapshot
    const snapshot =
        candidate &&
        candidate.actorId === actorId &&
        candidate.grading?.id === grading?.id &&
        candidate.draft.assignmentId === assignment.id
            ? candidate
            : null
    const baseline = snapshot?.grading ?? grading
    recovery.$reset()
    const completed = shallowRef<Grading>()
    const permitted = computed(
        () =>
            store.user?.id === actorId &&
            (baseline
                ? canActOnGrading(store.user, baseline, 'update')
                : evaluateRecordAccess(store.user, 'gradings.create', assignment) === 'allowed'),
    )
    const form = useMasterForm<GradingInput>({
        resource: 'gradings',
        initial: gradingDraft(baseline, assignment),
        snapshot,
        validate: validateGrading,
        write: async (draft, signal, idempotencyKey) => {
            if (!permitted.value) throw new ApiError('forbidden')
            const options = {
                signal,
                idempotencyKey,
                snapshotGeneration: baseline?.snapshotGeneration ?? assignment.snapshotGeneration,
            }
            completed.value = baseline
                ? await api.update(baseline.id, { ...draft, version: baseline.version }, options)
                : await api.create(draft, options)
        },
        recover: (draft, idempotencyKey, id) => {
            recovery.snapshot = {
                actorId: id,
                grading: baseline,
                draft: gradingDraft(draft),
                idempotencyKey,
            }
        },
        saved: () => {
            if (completed.value) saved(completed.value)
        },
    })
    return { ...form, permitted, completed }
}
