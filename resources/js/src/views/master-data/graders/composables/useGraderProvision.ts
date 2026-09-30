import { inject } from 'vue'
import { gradersApiKey } from '@/api/graders-api'
import type { Grader, GraderProvisionInput } from '@/core/types/grader'
import { useSessionStore } from '@/stores/session'
import { useGraderRecoveryStore } from '@/stores/grader-recovery'
import { useMasterForm } from '@/composables/useMasterForm'

export function useGraderProvision(
    grader: Grader,
    saved: () => void,
): ReturnType<typeof useMasterForm<GraderProvisionInput>> {
    const api = inject(gradersApiKey)
    if (!api) throw new Error('Graders API is not configured')
    const session = useSessionStore()
    const recovery = useGraderRecoveryStore()
    const recovered = recovery.provision?.actorId === session.user?.id ? recovery.provision : null
    recovery.provision = null
    return useMasterForm<GraderProvisionInput>({
        resource: 'graders',
        initial: { version: grader.version },
        snapshot: recovered
            ? {
                  draft: { version: recovered.grader.version },
                  idempotencyKey: recovered.idempotencyKey,
              }
            : null,
        validate: () => ({}),
        write: (input, signal, idempotencyKey) =>
            api.provision(grader.id, input, {
                signal,
                idempotencyKey,
                snapshotGeneration: grader.snapshotGeneration,
            }),
        recover: (_input, idempotencyKey, actorId) => {
            recovery.provision = { actorId, grader, idempotencyKey }
        },
        saved,
    })
}
