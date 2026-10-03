import { computed, onScopeDispose, provide, ref, shallowRef, watch } from 'vue'
import { formValidationKey } from '@/core/types/form-validation'
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
    readonly retrySafe?: boolean
    readonly requiredPermission?: string
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
    const touched = new Set<string>()
    const rejectedValues = new Map<string, string | undefined>()
    function validateField(field: string): void {
        const root = field.split('.')[0] ?? ''
        if (!(root in draft.value) || pending.value || uncertain.value) return
        if (
            rejectedValues.has(field) &&
            rejectedValues.get(field) === JSON.stringify(draft.value[root as keyof Input])
        )
            return
        rejectedValues.delete(field)
        touched.add(field)
        const matches = (key: string): boolean => key === field || key.startsWith(field + '.')
        errors.value = Object.fromEntries([
            ...Object.entries(errors.value).filter(([key]) => !matches(key)),
            ...Object.entries(options.validate(draft.value)).filter(([key]) => matches(key)),
        ]) as Partial<Record<keyof Input, string>>
    }
    provide(formValidationKey, validateField)
    watch(draft, (current, previous) => {
        for (const field of Object.keys(current) as (keyof Input)[]) {
            if (JSON.stringify(current[field]) === JSON.stringify(previous[field])) continue
            for (const name of new Set([...touched, ...Object.keys(errors.value)])) {
                if (name === field || name.startsWith(String(field) + '.')) validateField(name)
            }
        }
    })
    async function report(cause: unknown): Promise<void> {
        const failure = normalizeApiError(cause)
        error.value = `${options.resource}.errors.${failure.kind}`
        errors.value = Object.fromEntries(
            Object.entries(failure.fieldErrors).map(([field, messages]) => [
                field,
                messages[0] ?? `${options.resource}.invalid`,
            ]),
        ) as Partial<Record<keyof Input, string>>
        rejectedValues.clear()
        for (const field of Object.keys(failure.fieldErrors)) {
            const root = field.split('.')[0] as keyof Input
            rejectedValues.set(field, JSON.stringify(draft.value[root]))
        }
        uncertain.value =
            uncertain.value || failure.kind === 'network' || failure.kind === 'unexpected'
        if (failure.kind === 'csrf' && store.user)
            options.recover({ ...draft.value }, key, store.user.id)
        await session.handleRequestFailure(cause)
    }
    async function save(): Promise<void> {
        if (pending.value || !store.user) return
        if (
            options.requiredPermission &&
            !store.user.permissions.includes(options.requiredPermission)
        ) {
            error.value = `${options.resource}.errors.forbidden`
            return
        }
        if (uncertain.value && options.retrySafe === false) return
        errors.value = options.validate(draft.value)
        for (const field of Object.keys(draft.value)) touched.add(field)
        if (Object.keys(errors.value).length) return
        const payload = JSON.stringify(draft.value)
        if (uncertain.value && lastPayload && lastPayload !== payload) return
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
            if (request === active) pending.value = false
        }
    }
    watch(
        () => JSON.stringify([store.user?.id, [...(store.user?.permissions ?? [])].sort()]),
        () => {
            request?.abort()
            draft.value = { ...options.initial }
            errors.value = {}
            touched.clear()
            rejectedValues.clear()
            error.value = ''
            pending.value = false
            uncertain.value = false
        },
    )
    onScopeDispose(() => request?.abort())
    return { draft, errors, error, pending, uncertain, dirty, save }
}
