import { inject } from 'vue'
import { mitrasApiKey } from '@/api/mitras-api'
import type { Mitra, MitraInput } from '@/core/types/mitra'
import { mitraDraft, emptyMitra, validateMitra } from '@/core/domain/mitra-validation'
import { useSessionStore } from '@/stores/session'
import { useMitraRecoveryStore } from '@/stores/mitra-recovery'
import { useMasterForm } from '@/composables/useMasterForm'

export function useMitraForm(
    mitra: Mitra | undefined,
    saved: () => void,
): ReturnType<typeof useMasterForm<MitraInput>> {
    const api = inject(mitrasApiKey)
    if (!api) throw new Error('Mitras API is not configured')
    const store = useSessionStore()
    const recovery = useMitraRecoveryStore()
    const snapshot = recovery.snapshot?.actorId === store.user?.id ? recovery.snapshot : null
    recovery.$reset()
    return useMasterForm<MitraInput>({
        resource: 'mitras',
        initial: mitra ? mitraDraft(mitra) : emptyMitra(),
        snapshot,
        validate: validateMitra,
        write: (draft, signal, idempotencyKey) => {
            const options = {
                signal,
                idempotencyKey,
                snapshotGeneration: mitra?.snapshotGeneration,
            }
            return mitra
                ? api.update(mitra.id, { ...draft, version: mitra.version }, options)
                : api.create(draft, options)
        },
        recover: (draft, idempotencyKey, actorId) => {
            recovery.snapshot = { actorId, mitra, draft, idempotencyKey }
        },
        saved,
    })
}
