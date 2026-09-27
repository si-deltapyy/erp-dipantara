import type { WorkflowRecord, WorkflowApi } from '@/core/types/workflow'
import type { SessionUser } from '@/core/types/session'
import type { ComputedRef } from 'vue'
import { computed, onScopeDispose, ref, watch } from 'vue'
import type { Ref } from 'vue'
import { useSessionStore } from '@/stores/session'
import { useSession } from '@/composables/useSession'
import { normalizeApiError, isRequestCancelled } from '@/services/api-error'

interface RecordSubmitState {
    pending: Ref<boolean>
    confirming: Ref<boolean>
    error: Ref<string>
    uncertain: Ref<boolean>
    canSubmit: ComputedRef<boolean>
    submit(): Promise<void>
}

export function useRecordSubmit<T extends WorkflowRecord>(
    record: Ref<T | undefined>,
    options: {
        resource: string
        api: Pick<WorkflowApi<T>, 'submit'>
        canAct(actor: SessionUser | null, record: T, action: 'submit'): boolean
        snapshot(): { actorId: string; record: T; idempotencyKey: string } | null
        recover(record: T, key: string, actorId: string): void
        clear(): void
    },
): RecordSubmitState {
    const api = options.api
    const store = useSessionStore()
    const session = useSession()
    const pending = ref(false)
    const confirming = ref(false)
    const error = ref('')
    const uncertain = ref(false)
    let identity = ''
    let key: string = crypto.randomUUID()
    let active: AbortController | undefined
    const canSubmit = computed(
        () => !!record.value && options.canAct(store.user, record.value, 'submit'),
    )
    watch([() => store.user?.id, () => record.value?.id], () => {
        active?.abort()
        active = undefined
        identity = ''
        key = crypto.randomUUID()
        pending.value = false
        confirming.value = false
        error.value = ''
        uncertain.value = false
    })
    watch(record, (current) => {
        const snapshot = options.snapshot()
        if (
            current &&
            snapshot &&
            snapshot.actorId === store.user?.id &&
            snapshot.record?.id === current.id
        ) {
            key = snapshot.idempotencyKey
            identity = `${store.user?.id}:${current.id}:${snapshot.record.version}`
            error.value = `${options.resource}.errors.csrf`
            options.clear()
        }
    })
    async function submit(): Promise<void> {
        const current = record.value
        if (!current || pending.value || !canSubmit.value) return
        const next = `${store.user?.id}:${current.id}:${current.version}`
        if (identity && next !== identity) key = crypto.randomUUID()
        identity = next
        active = new AbortController()
        const request = active
        pending.value = true
        confirming.value = false
        error.value = ''
        try {
            const result = await api.submit(
                current.id,
                { version: current.version },
                {
                    signal: request.signal,
                    idempotencyKey: key,
                    snapshotGeneration: current.snapshotGeneration,
                },
            )
            if (!request.signal.aborted) {
                record.value = result
                uncertain.value = false
            }
        } catch (cause) {
            if (request.signal.aborted || isRequestCancelled(cause)) return
            const failure = normalizeApiError(cause)
            error.value =
                failure.fieldErrors.assignments?.[0] ?? `${options.resource}.errors.${failure.kind}`
            uncertain.value =
                uncertain.value || failure.kind === 'network' || failure.kind === 'unexpected'
            if (failure.kind === 'csrf' && store.user) options.recover(current, key, store.user.id)
            await session.handleRequestFailure(cause)
        } finally {
            if (active === request) pending.value = false
        }
    }
    onScopeDispose(() => active?.abort())
    return { pending, confirming, error, uncertain, canSubmit, submit }
}
