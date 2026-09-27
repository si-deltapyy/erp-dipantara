import type * as DemoRepositoryModule from '@/api/mocks/persistence/demo-repository'
import type * as DemoTransactionModule from '@/api/mocks/persistence/transaction'
import { test, expect } from '@playwright/test'

test.skip(process.env.E2E_PRODUCTION === 'true', 'Development IndexedDB repository only')
test('does not silently reseed existing records when dataset metadata is missing', async ({
    page,
}) => {
    await page.goto('/app/login')
    const result = await page.evaluate(async () => {
        const base = 'http://127.0.0.1:5174/resources/js/src/api/mocks/persistence/'
        const { DemoRepository } = (await import(
            base + 'demo-repository.ts'
        )) as typeof DemoRepositoryModule
        const { runDemoTransaction } = (await import(
            base + 'transaction.ts'
        )) as typeof DemoTransactionModule
        const options = { name: 'test-metadata-' + crypto.randomUUID() }
        const repository = new DemoRepository(options)
        await repository.initialize()
        await runDemoTransaction(options, ['metadata'], 'readwrite', (transaction) =>
            transaction.clear('metadata'),
        )
        const failure = await repository
            .initialize()
            .catch((error: unknown) => (error as { kind: string }).kind)
        const count = await runDemoTransaction(options, ['samples'], 'readonly', (transaction) =>
            transaction.count('samples'),
        )
        return { failure: typeof failure === 'string' ? failure : 'unexpected', count }
    })
    expect(result).toEqual({ failure: 'incompatible', count: 2 })
})
