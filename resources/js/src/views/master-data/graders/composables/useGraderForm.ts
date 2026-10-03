import { inject } from 'vue'
import { gradersApiKey } from '@/api/graders-api'
import type { GraderRecord, GraderContactInput } from '@/core/types/grader'
import { validateGraderContact } from '@/core/domain/grader-validation'
import { useSessionStore } from '@/stores/session'
import { useGraderRecoveryStore } from '@/stores/grader-recovery'
import { useMasterForm } from '@/composables/useMasterForm'

export function useGraderForm(
    grader: GraderRecord,
    saved: () => void,
): ReturnType<typeof useMasterForm<GraderContactInput>> {
    const api = inject(gradersApiKey)
    if (!api) throw new Error('Graders API is not configured')
    const store = useSessionStore()
    const recovery = useGraderRecoveryStore()
    const snapshot =
        recovery.snapshot?.actorId === store.user?.id && recovery.snapshot?.grader?.id === grader.id
            ? recovery.snapshot
            : null
    recovery.snapshot = null
    return useMasterForm<GraderContactInput>({
        resource: 'graders',
        retrySafe: false,
        requiredPermission: 'graders.update.all',
        initial: { phone: grader.phone, graderGroup: grader.graderGroup },
        snapshot,
        validate: validateGraderContact,
        write: (draft, signal, idempotencyKey) =>
            api.update(grader.id, draft, { signal, idempotencyKey }),
        recover: (draft, idempotencyKey, actorId) => {
            recovery.snapshot = { actorId, grader, draft, idempotencyKey }
        },
        saved,
    })
}
