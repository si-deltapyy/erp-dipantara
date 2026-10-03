import { inject } from 'vue'
import { mitrasApiKey } from '@/api/mitras-api'
import type { MitraRecord, MitraInput } from '@/core/types/mitra'
import { mitraDraft, emptyMitra, validateMitra } from '@/core/domain/mitra-validation'
import { useSessionStore } from '@/stores/session'
import { useMitraRecoveryStore } from '@/stores/mitra-recovery'
import { useMasterForm } from '@/composables/useMasterForm'

export function useMitraForm(
    mitra: MitraRecord | undefined,
    saved: () => void,
): ReturnType<typeof useMasterForm<MitraInput>> {
    const api = inject(mitrasApiKey)
    if (!api) throw new Error('Mitras API is not configured')
    const store = useSessionStore()
    const recovery = useMitraRecoveryStore()
    const snapshot =
        recovery.snapshot?.actorId === store.user?.id && recovery.snapshot?.mitra?.id === mitra?.id
            ? recovery.snapshot
            : null
    recovery.$reset()
    return useMasterForm<MitraInput>({
        retrySafe: false,
        requiredPermission: mitra ? 'mitras.update.all' : 'mitras.create.all',
        resource: 'mitras',
        initial: mitra ? mitraDraft(mitra) : emptyMitra(),
        snapshot,
        validate: validateMitra,
        write: (draft, signal, idempotencyKey) => {
            const options = {
                signal,
                idempotencyKey,
            }
            return mitra ? api.update(mitra.id, draft, options) : api.create(draft, options)
        },
        recover: (draft, idempotencyKey, actorId) => {
            recovery.snapshot = { actorId, mitra, draft, idempotencyKey }
        },
        saved,
    })
}
