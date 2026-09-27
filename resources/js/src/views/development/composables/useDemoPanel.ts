import { computed, onScopeDispose, ref, shallowRef, toRef, watch } from 'vue'
import type { ComputedRef, Ref } from 'vue'
import { useDemoRuntime } from '@/composables/useDemoRuntime'
import { useSession } from '@/composables/useSession'
import { useSessionStore } from '@/stores/session'
import { useDemoFeedbackStore } from '@/stores/demo-feedback'
import { adapterModes } from '@/core/constants/environment'
import { evaluateRecordAccess } from '@/core/domain/record-policy'
import type { DemoSnapshot, SampleMutation } from '@/api/mocks/persistence/demo-repository'
import type { DemoSample } from '@/api/mocks/persistence/schema'
import { DemoStorageError } from '@/api/mocks/persistence/storage-error'
import type { DemoOperation, OperationControl } from '@/api/mocks/operation-controls'
import { isRequestCancelled, normalizeApiError } from '@/services/api-error'

interface DemoPanelState {
    readonly snapshot: Ref<DemoSnapshot | undefined>
    readonly samples: ComputedRef<readonly DemoSample[]>
    readonly modes: readonly string[]
    readonly errorKey: Ref<string>
    readonly loading: Ref<boolean>
    readonly saving: Ref<boolean>
    readonly confirming: Ref<boolean>
    readonly resetting: Ref<boolean>
    readonly retryMutation: Ref<SampleMutation | undefined>
    readonly canControl: ComputedRef<boolean>
    canUpdate(sample: DemoSample): boolean
    refresh(): Promise<void>
    increment(sample: DemoSample): Promise<void>
    retry(): Promise<void>
    reset(): Promise<void>
    configure(operation: DemoOperation, control: OperationControl): void
}
export function useDemoPanel(): DemoPanelState {
    const runtime = useDemoRuntime()
    const session = useSession()
    const store = useSessionStore()
    const snapshot = shallowRef<DemoSnapshot>()
    const feedback = useDemoFeedbackStore()
    const errorKey = toRef(feedback, 'errorKey')
    const loading = ref(false)
    const saving = ref(false)
    const confirming = ref(false)
    const resetting = ref(false)
    const retryMutation = shallowRef<SampleMutation>()
    let readRequest: AbortController | undefined
    let writeRequest: AbortController | undefined
    let disposed = false
    const canControl = computed(
        () => !!store.user?.developmentCapabilities.includes('development.mock.view'),
    )
    const samples = computed(() =>
        adapterModes.domains.gradings === 'mock' ? (snapshot.value?.samples ?? []) : [],
    )
    const modes = Object.entries(adapterModes.domains)
        .filter(([, mode]) => mode === 'mock')
        .map(([domain]) => domain)

    async function report(cause: unknown): Promise<void> {
        if (isRequestCancelled(cause) || disposed) return
        errorKey.value =
            cause instanceof DemoStorageError
                ? `demo.storage.${cause.kind}`
                : `demo.errors.${normalizeApiError(cause).kind}`
        await session.handleRequestFailure(cause)
    }
    async function refresh(): Promise<void> {
        readRequest?.abort()
        const request = new AbortController()
        readRequest = request
        loading.value = true
        try {
            const next = await runtime.read(store.user, request.signal)
            if (!request.signal.aborted) snapshot.value = next
        } catch (cause) {
            if (!request.signal.aborted) await report(cause)
        } finally {
            if (readRequest === request) loading.value = false
        }
    }
    function canUpdate(sample: DemoSample): boolean {
        return (
            adapterModes.domains.gradings === 'mock' &&
            evaluateRecordAccess(store.user, 'gradings.update', sample) === 'allowed'
        )
    }
    async function save(input: SampleMutation): Promise<void> {
        if (saving.value || resetting.value) return
        const request = new AbortController()
        writeRequest = request
        saving.value = true
        errorKey.value = ''
        retryMutation.value = input
        try {
            await runtime.update(store.user, input, request.signal)
            if (!request.signal.aborted) {
                retryMutation.value = undefined
                await refresh()
            }
        } catch (cause) {
            if (!request.signal.aborted) {
                if (normalizeApiError(cause).kind !== 'network') retryMutation.value = undefined
                await report(cause)
            }
        } finally {
            if (writeRequest === request) saving.value = false
        }
    }
    async function increment(sample: DemoSample): Promise<void> {
        if (!snapshot.value || !canUpdate(sample) || retryMutation.value) return
        await save({
            id: sample.id,
            version: sample.version,
            quantity: sample.quantity + 1,
            generation: snapshot.value.metadata.generation,
            idempotencyKey: crypto.randomUUID(),
        })
    }
    async function retry(): Promise<void> {
        if (retryMutation.value) await save(retryMutation.value)
    }
    async function reset(): Promise<void> {
        if (resetting.value || !canControl.value) return
        resetting.value = true
        errorKey.value = ''
        try {
            await runtime.reset(store.user)
            snapshot.value = undefined
            retryMutation.value = undefined
            confirming.value = false
            await refresh()
        } catch (cause) {
            await report(cause)
        } finally {
            resetting.value = false
        }
    }
    function configure(operation: DemoOperation, control: OperationControl): void {
        try {
            runtime.configure(store.user, operation, control)
            errorKey.value = ''
        } catch (cause) {
            void report(cause)
        }
    }
    watch(
        () => store.user,
        () => {
            readRequest?.abort()
            writeRequest?.abort()
            snapshot.value = undefined
            retryMutation.value = undefined
            if (store.user && feedback.actorId !== store.user.id)
                feedback.$patch({ actorId: store.user.id, errorKey: '' })
            if (!store.user && store.status === 'guest') feedback.$reset()
            if (store.user) void refresh()
        },
        { immediate: true },
    )
    const unsubscribe = runtime.subscribe(() => {
        if (!resetting.value && store.user) void refresh()
    })
    onScopeDispose(() => {
        disposed = true
        readRequest?.abort()
        writeRequest?.abort()
        unsubscribe()
    })
    return {
        snapshot,
        samples,
        modes,
        errorKey,
        loading,
        saving,
        confirming,
        resetting,
        retryMutation,
        canControl,
        canUpdate,
        refresh,
        increment,
        retry,
        reset,
        configure,
    }
}
