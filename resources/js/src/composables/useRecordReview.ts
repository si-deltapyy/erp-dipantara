import type {
    WorkflowRecord,
    WorkflowApi,
    ReviewAction,
    ReviewSnapshot,
} from '@/core/types/workflow'
import type { SessionUser } from '@/core/types/session'
import { computed, onScopeDispose, ref, watch } from 'vue'
import type { ComputedRef, Ref } from 'vue'
import { useSessionStore } from '@/stores/session'
import { useSession } from '@/composables/useSession'
import { normalizeApiError, isRequestCancelled } from '@/services/api-error'

interface RecordReviewState {
    action: Ref<ReviewAction | undefined>
    reason: Ref<string>
    reasonError: Ref<string>
    error: Ref<string>
    pending: Ref<boolean>
    uncertain: Ref<boolean>
    blocked: Ref<boolean>
    canApprove: ComputedRef<boolean>
    canReject: ComputedRef<boolean>
    open(action: ReviewAction): void
    close(): void
    submit(): Promise<void>
    reload(): Promise<void>
}

export function useRecordReview<T extends WorkflowRecord>(
    record: Ref<T | undefined>,
    refresh: () => Promise<void>,
    recordId: () => unknown,
    options: {
        resource: string
        api: Pick<WorkflowApi<T>, 'approve' | 'reject'>
        recovery: { review: ReviewSnapshot<T> | null }
        canAct(actor: SessionUser | null, record: T, action: ReviewAction): boolean
    },
): RecordReviewState {
    const api = options.api
    const store = useSessionStore()
    const session = useSession()
    const recovery = options.recovery
    const action = ref<ReviewAction>()
    const reason = ref('')
    const reasonError = ref('')
    const error = ref('')
    const pending = ref(false)
    const uncertain = ref(false)
    const blocked = ref(false)
    let active: AbortController | undefined
    let attempt: ReviewSnapshot<T> | undefined
    let currentId = record.value?.id
    const canApprove = computed(
        () => !!record.value && options.canAct(store.user, record.value, 'approve'),
    )
    const canReject = computed(
        () => !!record.value && options.canAct(store.user, record.value, 'reject'),
    )
    function reset(): void {
        active?.abort()
        active = undefined
        attempt = undefined
        action.value = undefined
        reason.value = ''
        reasonError.value = ''
        error.value = ''
        pending.value = false
        uncertain.value = false
        blocked.value = false
    }
    watch([() => store.user, recordId], () => reset(), { flush: 'sync' })
    watch(
        record,
        (current) => {
            if (!current) {
                active?.abort()
                pending.value = false
                return
            }
            if (currentId && currentId !== current.id) reset()
            currentId = current.id
            const snapshot = recovery.review
            if (
                snapshot &&
                snapshot.actorId === store.user?.id &&
                snapshot.record.id === current.id
            ) {
                attempt = snapshot
                reason.value = snapshot.reason
                action.value = snapshot.action
                error.value = `${options.resource}.reviewCsrf`
                recovery.review = null
            }
        },
        { immediate: true, flush: 'sync' },
    )
    function open(next: ReviewAction): void {
        if (pending.value || blocked.value || (uncertain.value && attempt?.action !== next)) return
        if (!(next === 'approve' ? canApprove.value : canReject.value)) return
        action.value = next
        reasonError.value = ''
    }
    function close(): void {
        if (pending.value || uncertain.value) return
        action.value = undefined
        reason.value = ''
        reasonError.value = ''
    }
    async function reload(): Promise<void> {
        if (pending.value) return
        action.value = undefined
        const actor = store.user
        const id = recordId()
        await refresh()
        if (!record.value || actor !== store.user || id !== recordId()) return
        if (!canApprove.value && !canReject.value) return reset()
        attempt = undefined
        uncertain.value = false
        blocked.value = false
        error.value = ''
    }
    async function submit(): Promise<void> {
        const current = record.value
        const selected = action.value
        if (!current || !selected || !store.user || pending.value || blocked.value) return
        if (!(selected === 'approve' ? canApprove.value : canReject.value)) return
        const trimmed = reason.value.trim()
        if (selected === 'reject' && (!trimmed || [...trimmed].length > 2000)) {
            reasonError.value = `${options.resource}.reasonInvalid`
            return
        }
        if (
            !uncertain.value &&
            (!attempt ||
                attempt.record.version !== current.version ||
                attempt.action !== selected ||
                attempt.reason !== trimmed)
        )
            attempt = {
                actorId: store.user.id,
                record: current,
                action: selected,
                reason: trimmed,
                idempotencyKey: crypto.randomUUID(),
            }
        if (!attempt) return
        const snapshot = attempt
        const request = new AbortController()
        active = request
        pending.value = true
        error.value = ''
        reasonError.value = ''
        try {
            const options = {
                signal: request.signal,
                idempotencyKey: snapshot.idempotencyKey,
                snapshotGeneration: snapshot.record.snapshotGeneration,
            }
            const result =
                snapshot.action === 'approve'
                    ? await api.approve(
                          snapshot.record.id,
                          { version: snapshot.record.version },
                          options,
                      )
                    : await api.reject(
                          snapshot.record.id,
                          { version: snapshot.record.version, reason: snapshot.reason },
                          options,
                      )
            if (request.signal.aborted) return
            record.value = result
            reset()
        } catch (cause) {
            if (request.signal.aborted || isRequestCancelled(cause)) return
            const failure = normalizeApiError(cause)
            error.value =
                failure.fieldErrors.assignments?.[0] ?? `${options.resource}.errors.${failure.kind}`
            uncertain.value =
                uncertain.value || failure.kind === 'network' || failure.kind === 'unexpected'
            blocked.value = ['conflict', 'forbidden', 'not-found'].includes(failure.kind)
            if (failure.kind === 'validation' && failure.fieldErrors.reason)
                reasonError.value = `${options.resource}.reasonInvalid`
            if (failure.kind === 'csrf') recovery.review = snapshot
            await session.handleRequestFailure(cause)
        } finally {
            if (active === request) pending.value = false
        }
    }
    onScopeDispose(() => active?.abort())
    return {
        action,
        reason,
        reasonError,
        error,
        pending,
        uncertain,
        blocked,
        canApprove,
        canReject,
        open,
        close,
        submit,
        reload,
    }
}
