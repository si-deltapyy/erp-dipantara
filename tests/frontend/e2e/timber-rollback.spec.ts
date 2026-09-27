import { expect, test } from '@playwright/test'
import type * as DemoModule from '../../../resources/js/src/api/mocks/persistence/demo-repository'
import type * as TransactionModule from '../../../resources/js/src/api/mocks/persistence/transaction'
import type * as MutationModule from '../../../resources/js/src/api/mocks/persistence/timber-product-mutation'
import type * as SessionModule from '../../../resources/js/src/api/mocks/session-fixtures'

test.skip(process.env.E2E_PRODUCTION === 'true', 'Timber transaction fault injection')
test('rolls back the record, metadata, audit and receipt when a timber mutation fails', async ({
    page,
}) => {
    await page.goto('/app')
    const result = await page.evaluate(async () => {
        const base = 'http://127.0.0.1:5174/resources/js/src/api/mocks/'
        const { DemoRepository } = (await import(
            base + 'persistence/demo-repository.ts'
        )) as typeof DemoModule
        const { runDemoTransaction } = (await import(
            base + 'persistence/transaction.ts'
        )) as typeof TransactionModule
        const { writeTimberProduct } = (await import(
            base + 'persistence/timber-product-mutation.ts'
        )) as typeof MutationModule
        const { sessionFixtures } = (await import(
            base + 'session-fixtures.ts'
        )) as typeof SessionModule
        const actor = sessionFixtures.find((user) => user.id === 'admin-demo')
        if (!actor) throw new Error('Missing actor')
        const options = { name: 'timber-rollback-' + crypto.randomUUID() }
        const metadata = await new DemoRepository(options).initialize()
        const stores = ['timber-products', 'metadata', 'audit', 'timberProductMutations'] as const
        const failure = await runDemoTransaction(
            options,
            stores,
            'readwrite',
            async (transaction) => {
                await writeTimberProduct(transaction, metadata, actor, {
                    input: {
                        name: 'Rollback Timber',
                        gradeCode: 'TEST',
                        diameterCm: '20.00',
                        lengthM: '2.00',
                        purchasePrice: '1.00',
                        salePrice: '2.00',
                    },
                    idempotencyKey: 'rollback',
                    payloadHash: 'synthetic-hash',
                })
                throw new DOMException('Simulated quota failure', 'QuotaExceededError')
            },
        ).then(
            () => false,
            () => true,
        )
        const after = await runDemoTransaction(
            options,
            stores,
            'readonly',
            async (transaction) => ({
                count: await transaction.count('timber-products'),
                audits: await transaction.count('audit'),
                receipts: await transaction.count('timberProductMutations'),
                revision: (await transaction.get('metadata', 'dataset'))?.revision,
            }),
        )
        return { failure, ...after, originalRevision: metadata.revision }
    })
    expect(result.failure).toBe(true)
    expect(result.count).toBe(24)
    expect(result.audits).toBe(0)
    expect(result.receipts).toBe(0)
    expect(result.revision).toBe(result.originalRevision)
})
