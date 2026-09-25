import { expect, it } from 'vitest'
import { OperationControls } from './operation-controls'
import { DemoStorageError } from './persistence/storage-error'

it.each(['validation', 'forbidden', 'not-found', 'conflict', 'network'] as const)(
    'rejects %s before a mutation can begin',
    async (scenario) => {
        const controls = new OperationControls()
        controls.set('update', { scenario, latency: 0 })
        await expect(controls.before('update', new AbortController().signal)).rejects.toMatchObject(
            { kind: scenario },
        )
        await expect(controls.before('read', new AbortController().signal)).resolves.toBe('success')
    },
)
it.each(['csrf', 'unauthenticated'] as const)(
    'consumes %s to avoid a session refresh loop',
    async (scenario) => {
        const controls = new OperationControls()
        controls.set('read', { scenario, latency: 0 })
        await expect(controls.before('read', new AbortController().signal)).rejects.toMatchObject({
            kind: scenario,
        })
        await expect(controls.before('read', new AbortController().signal)).resolves.toBe('success')
    },
)
it('cancels delayed operations and distinguishes quota failures from API errors', async () => {
    const controls = new OperationControls()
    controls.set('update', { scenario: 'success', latency: 1500 })
    const request = new AbortController()
    const pending = controls.before('update', request.signal)
    request.abort()
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' })
    controls.set('update', { scenario: 'quota', latency: 0 })
    await expect(controls.before('update', new AbortController().signal)).rejects.toBeInstanceOf(
        DemoStorageError,
    )
})
it('models a lost response only after commit and clears configured failures on reset', async () => {
    const controls = new OperationControls()
    controls.set('update', { scenario: 'committed-timeout', latency: 0 })
    expect(await controls.before('update', new AbortController().signal)).toBe('committed-timeout')
    expect(() => controls.after('committed-timeout')).toThrow()
    controls.clear()
    expect(await controls.before('update', new AbortController().signal)).toBe('success')
})
