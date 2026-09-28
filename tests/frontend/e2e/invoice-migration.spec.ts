import { expect, test } from '@playwright/test'
import type * as DatabaseModule from '../../../resources/js/src/api/mocks/persistence/database'
import type * as TransactionModule from '../../../resources/js/src/api/mocks/persistence/transaction'
import type * as SchemaModule from '../../../resources/js/src/api/mocks/persistence/schema'
test.skip(process.env.E2E_PRODUCTION === 'true', 'Invoice migration mock')
test('upgrades schema 12 additively while preserving records, audit, receipts and binary documents', async ({
    page,
}) => {
    await page.goto('/app')
    const result = await page.evaluate(async () => {
        const origin = new URL(
            document.querySelector<HTMLScriptElement>('script[src*="/@vite/client"]')?.src ??
                location.origin,
        ).origin
        const { openDemoDatabase } = (await import(
            origin + '/resources/js/src/api/mocks/persistence/database.ts'
        )) as typeof DatabaseModule
        const { runDemoTransaction } = (await import(
            origin + '/resources/js/src/api/mocks/persistence/transaction.ts'
        )) as typeof TransactionModule
        const { demoStores } = (await import(
            origin + '/resources/js/src/api/mocks/persistence/schema.ts'
        )) as typeof SchemaModule
        const name = 'invoice-upgrade-' + crypto.randomUUID()
        const legacy = demoStores.filter(
            (store) => !['invoices', 'invoiceMutations', 'invoiceVersions'].includes(store),
        )
        await new Promise<void>((resolve, reject) => {
            const request = indexedDB.open(name, 12)
            request.onupgradeneeded = () => {
                for (const store of legacy) {
                    const table = request.result.createObjectStore(store, { keyPath: 'id' })
                    table.put(
                        store === 'blobs'
                            ? {
                                  id: 'preserved',
                                  content: new Blob(['preserved binary'], {
                                      type: 'application/pdf',
                                  }),
                              }
                            : { id: 'preserved', marker: store },
                    )
                }
            }
            request.onerror = () => reject(request.error)
            request.onsuccess = () => {
                request.result.close()
                resolve()
            }
        })
        const database = await openDemoDatabase({ name })
        const version = database.version
        database.close()
        const preserved = await runDemoTransaction(
            { name },
            demoStores,
            'readonly',
            async (transaction) => {
                const counts = await Promise.all(legacy.map((store) => transaction.count(store)))
                const blob = await transaction.get('blobs', 'preserved')
                return {
                    counts,
                    blob: blob?.content,
                    invoices: await transaction.count('invoices'),
                }
            },
        )
        return {
            version,
            counts: preserved.counts,
            invoices: preserved.invoices,
            binary: await preserved.blob?.text(),
        }
    })
    expect(result.version).toBeGreaterThanOrEqual(13)
    expect(result.counts.every((count) => count === 1)).toBe(true)
    expect(result.invoices).toBe(4)
    expect(result.binary).toBe('preserved binary')
})
