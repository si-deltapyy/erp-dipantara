import { inject, watch } from 'vue'
import { gradersApiKey } from '@/api/graders-api'
import type { Grader, GraderInput } from '@/core/types/grader'
import { graderDraft, emptyGrader, validateGrader } from '@/core/domain/grader-validation'
import { useSessionStore } from '@/stores/session'
import { useGraderRecoveryStore } from '@/stores/grader-recovery'
import { useMasterForm } from '@/composables/useMasterForm'

export function useGraderForm(
    grader: Grader | undefined,
    saved: () => void,
): ReturnType<typeof useMasterForm<GraderInput>> {
    const api = inject(gradersApiKey)
    if (!api) throw new Error('Graders API is not configured')
    const store = useSessionStore()
    const recovery = useGraderRecoveryStore()
    const snapshot = recovery.snapshot?.actorId === store.user?.id ? recovery.snapshot : null
    recovery.snapshot = null
    const form = useMasterForm<GraderInput>({
        resource: 'graders',
        initial: grader ? graderDraft(grader) : emptyGrader(),
        snapshot,
        validate: validateGrader,
        write: (draft, signal, idempotencyKey) => {
            const options = {
                signal,
                idempotencyKey,
                snapshotGeneration: grader?.snapshotGeneration,
            }
            return grader
                ? api.update(grader.id, { ...draft, version: grader.version }, options)
                : api.create(draft, options)
        },
        recover: (draft, idempotencyKey, actorId) => {
            recovery.snapshot = { actorId, grader, draft, idempotencyKey }
        },
        saved,
    })
    watch(form.draft, (current, previous) => {
        const remaining = { ...form.errors.value }
        for (const field of Object.keys(current) as (keyof GraderInput)[])
            if (current[field] !== previous[field]) delete remaining[field]
        form.errors.value = remaining
    })
    return form
}
