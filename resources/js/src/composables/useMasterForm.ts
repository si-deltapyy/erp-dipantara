import { computed, onScopeDispose, ref, shallowRef } from 'vue'
import type { ComputedRef, Ref, ShallowRef } from 'vue'
import { useSessionStore } from '@/stores/session'
import { useSession } from './useSession'
import { isRequestCancelled, normalizeApiError } from '@/services/api-error'

interface MasterFormState<Input> {
    readonly draft: ShallowRef<Input>
    readonly errors: ShallowRef<Partial<Record<keyof Input, string>>>
    readonly error: Ref<string>
    readonly pending: Ref<boolean>
    readonly uncertain: Ref<boolean>
    readonly dirty: ComputedRef<boolean>
    save(): Promise<void>
}
interface FormSnapshot<Input> {
    readonly draft: Input
    readonly idempotencyKey: string
}
interface MasterFormOptions<Input> {
    readonly resource: string
    readonly initial: Input
    readonly snapshot: FormSnapshot<Input> | null
    validate(input: Input): Partial<Record<keyof Input, string>>
    write(input: Input, signal: AbortSignal, key: string): Promise<unknown>
    recover(draft: Input, key: string, actorId: string): void
    saved(): void
}
export function useMasterForm<Input extends object>(
    options: MasterFormOptions<Input>,
): MasterFormState<Input> {
    const store = useSessionStore()
    const session = useSession()
    const snapshot = options.snapshot
    const draft = shallowRef(snapshot?.draft ?? options.initial) as ShallowRef<Input>
    let key = snapshot?.idempotencyKey ?? crypto.randomUUID()
    const errors = shallowRef<Partial<Record<keyof Input, string>>>({})
    const error = ref(snapshot ? `${options.resource}.errors.csrf` : '')
    const pending = ref(false)
    const uncertain = ref(false)
    const dirty = computed(
        () => !!store.user && JSON.stringify(draft.value) !== JSON.stringify(options.initial),
    )
    let request: AbortController | undefined
    let lastPayload = snapshot ? JSON.stringify(snapshot.draft) : ''
    async function report(cause: unknown): Promise<void> {
        const failure = normalizeApiError(cause)
        error.value = `${options.resource}.errors.${failure.kind}`
        errors.value = Object.fromEntries(
            Object.entries(failure.fieldErrors).map(([field, messages]) => [
                field,
                messages[0] ?? `${options.resource}.invalid`,
            ]),
        ) as Partial<Record<keyof Input, string>>
        uncertain.value = failure.kind === 'network'
        if (failure.kind === 'csrf' && store.user)
            options.recover({ ...draft.value }, key, store.user.id)
        await session.handleRequestFailure(cause)
    }
    async function save(): Promise<void> {
        if (pending.value) return
        errors.value = options.validate(draft.value)
        if (Object.keys(errors.value).length) return
        const payload = JSON.stringify(draft.value)
        if (lastPayload && lastPayload !== payload) key = crypto.randomUUID()
        lastPayload = payload
        request = new AbortController()
        const active = request
        pending.value = true
        error.value = ''
        try {
            await options.write({ ...draft.value }, active.signal, key)
            if (!active.signal.aborted) {
                uncertain.value = false
                options.saved()
            }
        } catch (cause) {
            if (!active.signal.aborted && !isRequestCancelled(cause)) await report(cause)
        } finally {
            pending.value = false
        }
    }
    onScopeDispose(() => request?.abort())
    return { draft, errors, error, pending, uncertain, dirty, save }
}
