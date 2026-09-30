import { computed, shallowRef } from 'vue'
import type { Grading, GradingRevisionInput } from '@/core/types/grading'
import { useGradingApi } from './useGradingApi'
import { useMasterForm } from '@/composables/useMasterForm'
import { useSessionStore } from '@/stores/session'
import { useGradingRecoveryStore } from '@/stores/grading-recovery'
import { canActOnGrading } from '@/core/domain/grading-policy'
import { validateGrading } from '@/core/domain/grading-draft'
import { ApiError } from '@/core/types/api-error'
type RevisionDraft = Omit<GradingRevisionInput, 'version'>
export function useGradingRevisionForm(
    parent: Grading,
    saved: (grading: Grading) => void,
): ReturnType<typeof createRevisionForm> {
    return createRevisionForm(parent, saved)
}
function createRevisionForm(parent: Grading, saved: (grading: Grading) => void) {
    const api = useGradingApi(),
        session = useSessionStore(),
        recovery = useGradingRecoveryStore()
    const actorId = session.user?.id
    const candidate = recovery.revision
    const snapshot =
        candidate && candidate.actorId === actorId && candidate.parent.id === parent.id
            ? candidate
            : null
    const baseline = snapshot?.parent ?? parent
    recovery.revision = null
    const completed = shallowRef<Grading>()
    const permitted = computed(
        () => session.user?.id === actorId && canActOnGrading(session.user, baseline, 'revise'),
    )
    const initial: RevisionDraft = {
        gradingDate: baseline.gradingDate,
        rows: baseline.rows.map((row) => ({ ...row })),
        reason: '',
    }
    const form = useMasterForm<RevisionDraft>({
        resource: 'gradings',
        initial,
        snapshot,
        validate: (draft) => {
            const errors = validateGrading({
                assignmentId: baseline.assignmentId,
                gradingDate: draft.gradingDate,
                rows: draft.rows,
            })
            if (!draft.reason.trim() || [...draft.reason.trim()].length > 255)
                errors.reason = 'gradings.revisionReasonInvalid'
            return errors
        },
        write: async (draft, signal, idempotencyKey) => {
            if (!permitted.value) throw new ApiError('forbidden')
            completed.value = await api.revise(
                baseline.id,
                { ...draft, version: baseline.version },
                { signal, idempotencyKey, snapshotGeneration: baseline.snapshotGeneration },
            )
        },
        recover: (draft, idempotencyKey, id) => {
            recovery.revision = {
                actorId: id,
                parent: baseline,
                draft: { ...draft, rows: draft.rows.map((row) => ({ ...row })) },
                idempotencyKey,
            }
        },
        saved: () => {
            if (completed.value) saved(completed.value)
        },
    })
    return { ...form, permitted }
}
