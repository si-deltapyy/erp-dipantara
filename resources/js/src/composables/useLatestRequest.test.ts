import { effectScope } from 'vue'
import type { EffectScope } from 'vue'
import type { LatestRequest } from './useLatestRequest'
import { it, expect, vi } from 'vitest'
import { useLatestRequest } from './useLatestRequest'
import { ApiError } from '@/core/types/api-error'

function deferred<Value>(): {
    promise: Promise<Value>
    resolve: (value: Value) => void
    reject: (cause: unknown) => void
} {
    let resolve: (value: Value) => void = () => {
        throw new Error('Promise not initialized')
    }
    let reject: (cause: unknown) => void = () => {
        throw new Error('Promise not initialized')
    }
    const promise = new Promise<Value>((success, failure) => {
        resolve = success
        reject = failure
    })
    return { promise, resolve, reject }
}

function createScopedRequest<Result>(
    scope: EffectScope,
    execute: (signal: AbortSignal) => Promise<Result>,
): LatestRequest<Result> {
    const request = scope.run(() => useLatestRequest(execute))
    if (!request) throw new Error('Expected an active effect scope')
    return request
}

it('ignores stale success even when the adapter ignores abort', async () => {
    const first = deferred<string>()
    const second = deferred<string>()
    const execute = vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)
    const scope = effectScope()
    const request = createScopedRequest<string>(scope, execute)
    const initial = request.run()
    const latest = request.run()
    second.resolve('latest')
    await latest
    first.resolve('stale')
    await initial
    expect(request.result.value).toBe('latest')
    expect(request.pending.value).toBe(false)
    expect(execute.mock.calls[0][0].aborted).toBe(true)
    scope.stop()
})

it('does not expose a stale error or end the newer loading state', async () => {
    const first = deferred<string>()
    const second = deferred<string>()
    const execute = vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)
    const scope = effectScope()
    const request = createScopedRequest<string>(scope, execute)
    const initial = request.run()
    const latest = request.run()
    first.reject(new ApiError('network'))
    await initial
    expect(request.error.value).toBeUndefined()
    expect(request.pending.value).toBe(true)
    second.resolve('latest')
    await latest
    scope.stop()
})

it('aborts on disposal and ignores late results', async () => {
    const response = deferred<string>()
    const execute = vi.fn(() => response.promise)
    const scope = effectScope()
    const request = createScopedRequest(scope, execute)
    const pending = request.run()
    scope.stop()
    response.resolve('late')
    await pending
    expect(request.result.value).toBeUndefined()
    expect(request.pending.value).toBe(false)
})

it('preserves validation fields and recovers on retry', async () => {
    const execute = vi
        .fn()
        .mockRejectedValueOnce(new ApiError('validation', { scenario: ['invalid-selection'] }))
        .mockResolvedValueOnce('recovered')
    const scope = effectScope()
    const request = createScopedRequest<string>(scope, execute)
    await request.run()
    expect(request.error.value?.fieldErrors.scenario).toEqual(['invalid-selection'])
    await request.run()
    expect(request.error.value).toBeUndefined()
    expect(request.result.value).toBe('recovered')
    scope.stop()
})
