import { expect, test } from '@playwright/test'
import type * as DemoModule from '../../../resources/js/src/api/mocks/persistence/demo-repository'
import type * as DatabaseModule from '../../../resources/js/src/api/mocks/persistence/database'
import type * as TransactionModule from '../../../resources/js/src/api/mocks/persistence/transaction'
import type * as MutationModule from '../../../resources/js/src/api/mocks/persistence/purchase-order-mutation'
import type * as SessionModule from '../../../resources/js/src/api/mocks/session-fixtures'

test.skip(process.env.E2E_PRODUCTION === 'true', 'PO IndexedDB migration and rollback')
test('preserves v6 data and rolls back create and submit including audit and receipts', async ({
    page,
}) => {
    await page.goto('/app')
    const result = await page.evaluate(async () => {
        const base = new URL(
            '/resources/js/src/api/mocks/',
            document.querySelector<HTMLScriptElement>('script[src*="/@vite/client"]')?.src ??
                location.origin,
        ).href
        const { DemoRepository } = (await import(
            base + 'persistence/demo-repository.ts'
        )) as typeof DemoModule
        const { openDemoDatabase } = (await import(
            base + 'persistence/database.ts'
        )) as typeof DatabaseModule
        const { runDemoTransaction } = (await import(
            base + 'persistence/transaction.ts'
        )) as typeof TransactionModule
        const { writePurchaseOrder } = (await import(
            base + 'persistence/purchase-order-mutation.ts'
        )) as typeof MutationModule
        const { sessionFixtures } = (await import(
            base + 'session-fixtures.ts'
        )) as typeof SessionModule
        const actor = sessionFixtures.find((user) => user.id === 'user-demo')
        if (!actor) throw new Error('Missing actor')
        const options = { name: 'po-rollback-' + crypto.randomUUID() }
        const metadata = await new DemoRepository(options).initialize()
        const stores = [
            'purchase-orders',
            'purchaseOrderMutations',
            'metadata',
            'audit',
            'buyers',
            'timber-products',
        ] as const
        const failures: boolean[] = []
        for (const action of ['create', 'submit'] as const) {
            failures.push(
                await runDemoTransaction(options, stores, 'readwrite', async (transaction) => {
                    await writePurchaseOrder(transaction, metadata, actor, {
                        action,
                        id: action === 'submit' ? 'demo-po-01' : undefined,
                        input:
                            action === 'submit'
                                ? { version: 1 }
                                : {
                                      buyerId: 'demo-buyer-01',
                                      number: 'Rollback',
                                      orderDate: '2026-09-26',
                                      notes: null,
                                      lines: [
                                          {
                                              timberProductId: 'demo-timber-01',
                                              quantity: 1,
                                              unitPrice: '1.00',
                                          },
                                      ],
                                  },
                        key: action,
                        hash: 'synthetic-hash',
                    })
                    throw new DOMException('Simulated failure', 'QuotaExceededError')
                }).then(
                    () => false,
                    () => true,
                ),
            )
        }
        const after = await runDemoTransaction(
            options,
            stores,
            'readonly',
            async (transaction) => ({
                orders: await transaction.count('purchase-orders'),
                receipts: await transaction.count('purchaseOrderMutations'),
                audit: await transaction.count('audit'),
                revision: (await transaction.get('metadata', 'dataset'))?.revision,
                status: (await transaction.get('purchase-orders', 'demo-po-01'))?.status,
            }),
        )
        const legacy = { name: 'po-upgrade-' + crypto.randomUUID() }
        await new Promise<void>((resolve, reject) => {
            const request = indexedDB.open(legacy.name, 6)
            request.onupgradeneeded = () => {
                for (const store of [
                    'buyers',
                    'mitras',
                    'timber-products',
                    'bank-accounts',
                    'graders',
                    'metadata',
                    'audit',
                    'buyerMutations',
                ])
                    request.result.createObjectStore(store, { keyPath: 'id' })
                for (const store of [
                    'buyers',
                    'mitras',
                    'timber-products',
                    'bank-accounts',
                    'graders',
                    'audit',
                    'buyerMutations',
                ])
                    request.transaction?.objectStore(store).put({ id: 'preserved', marker: store })
                request.transaction?.objectStore('metadata').put(metadata)
            }
            request.onerror = () => reject(request.error)
            request.onsuccess = () => {
                request.result.close()
                resolve()
            }
        })
        const database = await openDemoDatabase(legacy)
        const version = database.version
        database.close()
        const preserved = await runDemoTransaction(
            legacy,
            [
                'buyers',
                'mitras',
                'timber-products',
                'bank-accounts',
                'graders',
                'metadata',
                'audit',
                'buyerMutations',
                'purchase-orders',
            ],
            'readonly',
            async (transaction) => ({
                counts: await Promise.all(
                    (
                        [
                            'buyers',
                            'mitras',
                            'timber-products',
                            'bank-accounts',
                            'graders',
                            'audit',
                            'buyerMutations',
                        ] as const
                    ).map((store) => transaction.count(store)),
                ),
                generation: (await transaction.get('metadata', 'dataset'))?.generation,
                orders: await transaction.count('purchase-orders'),
            }),
        )
        return {
            failures,
            after,
            originalRevision: metadata.revision,
            version,
            preserved: preserved.counts,
            generation: preserved.generation === metadata.generation,
            seeds: preserved.orders,
        }
    })
    expect(result.failures).toEqual([true, true])
    expect(result.after).toEqual({
        orders: 26,
        receipts: 0,
        audit: 0,
        revision: result.originalRevision,
        status: 'draft',
    })
    expect(result.version).toBe(8)
    expect(result.preserved).toEqual([1, 1, 1, 1, 1, 1, 1])
    expect(result.generation).toBe(true)
    expect(result.seeds).toBe(26)
})
