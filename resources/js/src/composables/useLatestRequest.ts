import { onScopeDispose, readonly, shallowReadonly, shallowRef } from 'vue'
import type { DeepReadonly, ShallowRef } from 'vue'
import type { ApiError } from '@/core/types/api-error'
import { isRequestCancelled, normalizeApiError } from '@/services/api-error'

export interface LatestRequest<Result> {
    result: Readonly<ShallowRef<Result | undefined>>
    error: DeepReadonly<ShallowRef<ApiError | undefined>>
    pending: Readonly<ShallowRef<boolean>>
    run: () => Promise<void>
}

export function useLatestRequest<Result>(
    execute: (signal: AbortSignal) => Promise<Result>,
): LatestRequest<Result> {
    const result = shallowRef<Result>()
    const error = shallowRef<ApiError>()
    const pending = shallowRef(false)
    let current: AbortController | undefined

    async function run(): Promise<void> {
        current?.abort()
        const request = new AbortController()
        current = request
        pending.value = true
        error.value = undefined
        result.value = undefined
        try {
            const response = await execute(request.signal)
            if (!request.signal.aborted) result.value = response
        } catch (cause: unknown) {
            if (!request.signal.aborted && !isRequestCancelled(cause)) {
                error.value = normalizeApiError(cause)
            }
        } finally {
            if (current === request) pending.value = false
        }
    }

    onScopeDispose(() => {
        current?.abort()
        current = undefined
        pending.value = false
    })
    return {
        result: shallowReadonly(result),
        error: readonly(error),
        pending: readonly(pending),
        run,
    }
}
