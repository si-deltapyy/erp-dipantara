import type * as DemoRuntimeModule from '@/api/mocks/demo-runtime'
import type * as DemoRepositoryModule from '@/api/mocks/persistence/demo-repository'
import type * as SessionFixturesModule from '@/api/mocks/session-fixtures'
import { test, expect } from '@playwright/test'

test.skip(process.env.E2E_PRODUCTION === 'true', 'Development IndexedDB runtime only')

test('aborts delayed writes during reset and disposal without changing the new dataset', async ({
    page,
}) => {
    await page.goto('/app/login')
    const result = await page.evaluate(async () => {
        const base = 'http://127.0.0.1:5174/resources/js/src/api/mocks/'
        const { DemoRuntime } = (await import(base + 'demo-runtime.ts')) as typeof DemoRuntimeModule
        const { DemoRepository } = (await import(
            base + 'persistence/demo-repository.ts'
        )) as typeof DemoRepositoryModule
        const { sessionFixtures } = (await import(
            base + 'session-fixtures.ts'
        )) as typeof SessionFixturesModule
        const admin = sessionFixtures.find((user) => user.id === 'admin-demo') ?? null
        const grader = sessionFixtures.find((user) => user.id === 'grader-one') ?? null
        const repository = new DemoRepository({ name: 'test-lifecycle-' + crypto.randomUUID() })
        const runtime = new DemoRuntime(repository)
        const signal = new AbortController().signal
        const initial = await runtime.read(admin, signal)
        const input = {
            id: 'demo-sample-one',
            quantity: 1,
            version: 1,
            generation: initial.metadata.generation,
            idempotencyKey: 'delayed',
        }
        runtime.configure(admin, 'update', { scenario: 'success', latency: 1500 })
        const pending = runtime
            .update(admin, input, signal)
            .catch((error: unknown) => (error as { name: string }).name)
        await runtime.reset(admin)
        const cancelled = await pending
        const snapshot = await runtime.read(admin, signal)
        const denied = await runtime
            .reset(grader)
            .catch((error: unknown) => (error as { kind: string }).kind)
        runtime.configure(admin, 'read', { scenario: 'success', latency: 1500 })
        const delayedRead = runtime
            .read(admin, signal)
            .catch((error: unknown) => (error as { name: string }).name)
        runtime.dispose()
        return {
            cancelled,
            quantity: snapshot.samples[0]?.quantity,
            denied,
            disposed: await delayedRead,
        }
    })
    expect(result).toEqual({
        cancelled: 'AbortError',
        quantity: 0,
        denied: 'forbidden',
        disposed: 'AbortError',
    })
})
