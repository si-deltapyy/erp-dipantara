import { expect, test } from '@playwright/test'
import type * as DemoRepositoryModule from '../../../resources/js/src/api/mocks/persistence/demo-repository'
import type * as TransactionModule from '../../../resources/js/src/api/mocks/persistence/transaction'

test.skip(process.env.E2E_PRODUCTION === 'true', 'Native IndexedDB additive migration')

test('upgrades version three without deleting existing data and rolls back failed Timber writes', async ({
    page,
}) => {
    await page.goto('/app')
    const result = await page.evaluate(async () => {
        const base = 'http://127.0.0.1:5174/resources/js/src/api/mocks/persistence/'
        const { DemoRepository } = (await import(
            base + 'demo-repository.ts'
        )) as typeof DemoRepositoryModule
        const { runDemoTransaction } = (await import(
            base + 'transaction.ts'
        )) as typeof TransactionModule
        const name = 'timber-upgrade-' + crypto.randomUUID()
        await new Promise<void>((resolve, reject) => {
            const request = indexedDB.open(name, 3)
            request.onupgradeneeded = () => {
                for (const store of [
                    'metadata',
                    'samples',
                    'audit',
                    'blobs',
                    'mutations',
                    'buyers',
                    'buyerMutations',
                    'mitras',
                    'mitraMutations',
                ])
                    request.result.createObjectStore(store, { keyPath: 'id' })
                request.transaction?.objectStore('metadata').put({
                    id: 'dataset',
                    datasetVersion: 1,
                    generation: 'preserved-generation',
                    revision: 7,
                })
                request.transaction
                    ?.objectStore('buyers')
                    .put({ id: 'preserved-buyer', version: 8 })
                request.transaction
                    ?.objectStore('buyerMutations')
                    .put({ id: 'preserved-receipt', payloadHash: 'original' })
                request.transaction
                    ?.objectStore('mitras')
                    .put({ id: 'preserved-mitra', version: 9 })
                request.transaction
                    ?.objectStore('mitraMutations')
                    .put({ id: 'preserved-mitra-receipt', payloadHash: 'mitra-original' })
                request.transaction?.objectStore('audit').put({ id: 'preserved-audit', version: 8 })
                request.transaction?.objectStore('samples').put({ id: 'preserved', quantity: 42 })
                request.transaction
                    ?.objectStore('blobs')
                    .put({ id: 'preserved-blob', content: new Blob(['preserved']) })
            }
            request.onsuccess = () => {
                request.result.close()
                resolve()
            }
            request.onerror = () => reject(request.error)
        })
        const options = { name }
        const metadata = await new DemoRepository(options).initialize()
        const before = await runDemoTransaction(
            options,
            [
                'timber-products',
                'buyers',
                'buyerMutations',
                'mitras',
                'mitraMutations',
                'audit',
                'samples',
                'blobs',
            ],
            'readonly',
            async (transaction) => ({
                count: await transaction.count('timber-products'),
                mitraVersion: (await transaction.get('mitras', 'preserved-mitra'))?.version,
                mitraReceipt: (await transaction.get('mitraMutations', 'preserved-mitra-receipt'))
                    ?.payloadHash,
                buyerVersion: (await transaction.get('buyers', 'preserved-buyer'))?.version,
                receiptHash: (await transaction.get('buyerMutations', 'preserved-receipt'))
                    ?.payloadHash,
                auditCount: await transaction.count('audit'),
                quantity: (await transaction.get('samples', 'preserved'))?.quantity,
                blob: (await transaction.get('blobs', 'preserved-blob'))?.content,
            }),
        )
        await runDemoTransaction(
            options,
            ['timber-products', 'metadata', 'timberProductMutations', 'audit'],
            'readwrite',
            async (transaction) => {
                await transaction.clear('timber-products')
                await transaction.clear('audit')
                await transaction.put('metadata', { ...metadata, revision: 999 })
                throw new DOMException('Simulated quota failure', 'QuotaExceededError')
            },
        ).catch(() => undefined)
        const after = await runDemoTransaction(
            options,
            ['timber-products', 'metadata', 'audit'],
            'readonly',
            async (transaction) => ({
                count: await transaction.count('timber-products'),
                auditCount: await transaction.count('audit'),
                revision: (await transaction.get('metadata', 'dataset'))?.revision,
            }),
        )
        return {
            generation: metadata.generation,
            before: {
                count: before.count,
                mitraVersion: before.mitraVersion,
                mitraReceipt: before.mitraReceipt,
                quantity: before.quantity,
                buyerVersion: before.buyerVersion,
                receiptHash: before.receiptHash,
                auditCount: before.auditCount,
                blob: await before.blob?.text(),
            },
            after,
        }
    })
    expect(result).toEqual({
        generation: 'preserved-generation',
        before: {
            count: 24,
            mitraVersion: 9,
            mitraReceipt: 'mitra-original',
            quantity: 42,
            blob: 'preserved',
            buyerVersion: 8,
            receiptHash: 'original',
            auditCount: 1,
        },
        after: { count: 24, revision: 7, auditCount: 1 },
    })
})
