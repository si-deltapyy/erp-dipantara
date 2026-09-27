import type * as DatabaseModule from '../../../resources/js/src/api/mocks/persistence/database'
import { expect, test } from '@playwright/test'
import { login, expectNoOverflow } from './session-helpers'
import type * as OrderModule from '../../../resources/js/src/api/mocks/persistence/order-repository'
import type * as DemoModule from '../../../resources/js/src/api/mocks/persistence/demo-repository'
import type * as SessionModule from '../../../resources/js/src/api/mocks/session-fixtures'
test.skip(process.env.E2E_PRODUCTION === 'true', 'Order mock workflow')
test('creates and edits an order from an approved PO and persists after reload', async ({
    page,
}, info) => {
    await login(page, 'maker@woodflow.test', '/app/orders')
    await page.getByRole('link', { name: 'Tambah order', exact: true }).click()
    await page.getByLabel('Nomor PO', { exact: true }).selectOption('demo-po-03')
    await page.getByLabel('Catatan', { exact: true }).fill('Synthetic order processing')
    await page.getByRole('button', { name: 'Simpan draft', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Detail order', exact: true })).toBeVisible()
    await page.reload()
    await expect(page.getByText('Synthetic order processing', { exact: true })).toBeVisible()
    await page.getByRole('link', { name: 'Edit order', exact: true }).click()
    await page.getByLabel('Catatan', { exact: true }).fill('Synthetic revised note')
    await page.getByRole('button', { name: 'Simpan draft', exact: true }).click()
    await expect(page.getByText('Synthetic revised note', { exact: true })).toBeVisible()
    await expectNoOverflow(page)
    await page.screenshot({ path: info.outputPath('order-processing.png'), fullPage: true })
})
test('enforces approved parents, uniqueness, scoped reads, idempotency and stale versions atomically', async ({
    page,
}) => {
    await page.goto('/app')
    const result = await page.evaluate(async () => {
        const base = new URL(
            '/resources/js/src/',
            document.querySelector<HTMLScriptElement>('script[src*="/@vite/client"]')?.src ??
                location.origin,
        ).href
        const { OrderRepository } = (await import(
            base + 'api/mocks/persistence/order-repository.ts'
        )) as typeof OrderModule
        const { DemoRepository } = (await import(
            base + 'api/mocks/persistence/demo-repository.ts'
        )) as typeof DemoModule
        const { sessionFixtures } = (await import(
            base + 'api/mocks/session-fixtures.ts'
        )) as typeof SessionModule
        const options = { name: 'order-test-' + crypto.randomUUID() }
        const metadata = await new DemoRepository(options).initialize()
        const repository = new OrderRepository(options)
        const maker = sessionFixtures.find((actor) => actor.id === 'maker-demo')
        const user = sessionFixtures.find((actor) => actor.id === 'user-demo')
        if (!maker || !user) throw new Error('Missing actors')
        const signal = new AbortController().signal
        const failures: string[] = []
        async function capture(action: () => Promise<unknown>): Promise<void> {
            try {
                await action()
                failures.push('unexpected-success')
            } catch (cause) {
                failures.push((cause as { kind: string }).kind)
            }
        }
        const input = { purchaseOrderId: 'demo-po-03', notes: null }
        const mutation = { action: 'create' as const, input, key: 'same' }
        const first = await repository.mutate(maker, mutation, metadata.generation, signal)
        const retry = await repository.mutate(maker, mutation, metadata.generation, signal)
        await capture(() =>
            repository.mutate(
                maker,
                { ...mutation, key: 'duplicate' },
                metadata.generation,
                signal,
            ),
        )
        await capture(() =>
            repository.mutate(
                maker,
                {
                    ...mutation,
                    key: 'unapproved',
                    input: { ...input, purchaseOrderId: 'demo-po-01' },
                },
                metadata.generation,
                signal,
            ),
        )
        await capture(() => repository.get(user, first.id, signal))
        const updated = await repository.mutate(
            maker,
            {
                action: 'update',
                id: first.id,
                key: 'edit',
                input: { ...input, notes: 'Updated', version: first.version },
            },
            metadata.generation,
            signal,
        )
        await capture(() =>
            repository.mutate(
                maker,
                {
                    action: 'update',
                    id: first.id,
                    key: 'stale',
                    input: { ...input, version: first.version },
                },
                metadata.generation,
                signal,
            ),
        )
        const persisted = await new OrderRepository(options).get(maker, first.id, signal)
        return { first, retry, updated, persisted, failures }
    })
    expect(result.first.id).toBe(result.retry.id)
    expect(result.failures).toEqual(['conflict', 'validation', 'not-found', 'conflict'])
    expect(result.persisted.notes).toBe('Updated')
    expect(result.persisted.version).toBe(2)
})

test('upgrades schema eight without replacing PO records or document blobs', async ({ page }) => {
    await page.goto('/app')
    const result = await page.evaluate(async () => {
        const base = new URL(
            '/resources/js/src/',
            document.querySelector<HTMLScriptElement>('script[src*="/@vite/client"]')?.src ??
                location.origin,
        ).href
        const { openDemoDatabase } = (await import(
            base + 'api/mocks/persistence/database.ts'
        )) as typeof DatabaseModule
        const name = 'order-upgrade-' + crypto.randomUUID()
        await new Promise<void>((resolve, reject) => {
            const request = indexedDB.open(name, 8)
            request.onupgradeneeded = () => {
                const po = request.result.createObjectStore('purchase-orders', { keyPath: 'id' })
                po.put({ id: 'preserved-po', version: 17 })
                const documents = request.result.createObjectStore('documents', { keyPath: 'id' })
                documents.put({
                    id: 'preserved-document',
                    content: new Blob(['synthetic-preserved']),
                })
            }
            request.onerror = () => reject(request.error)
            request.onsuccess = () => {
                request.result.close()
                resolve()
            }
        })
        const db = await openDemoDatabase({ name })
        const transaction = db.transaction(['purchase-orders', 'documents', 'orders'], 'readonly')
        const poRequest = transaction.objectStore('purchase-orders').get('preserved-po')
        const documentRequest = transaction.objectStore('documents').get('preserved-document')
        const countRequest = transaction.objectStore('orders').count()
        await new Promise<void>((resolve, reject) => {
            transaction.oncomplete = () => resolve()
            transaction.onerror = () => reject(transaction.error)
        })
        const content = await (documentRequest.result as { content: Blob }).content.text()
        db.close()
        return {
            version: (poRequest.result as { version: number }).version,
            content,
            count: countRequest.result,
        }
    })
    expect(result).toEqual({ version: 17, content: 'synthetic-preserved', count: 0 })
})

test('retains order drafts through validation and session refresh and safely retries committed writes', async ({
    page,
}) => {
    await login(page, 'admin@woodflow.test', '/app/orders/new')
    await page.getByLabel('Nomor PO', { exact: true }).selectOption('demo-po-03')
    await page.getByLabel('Catatan', { exact: true }).fill('Synthetic recovery')
    async function scenario(value: string): Promise<void> {
        const panel = page.locator('details').filter({ hasText: 'Simulasi persisten' })
        if (!(await panel.evaluate((element) => element.hasAttribute('open'))))
            await panel.locator('summary').click()
        await page.getByLabel('Operasi simulasi').selectOption('update')
        await page.getByLabel('Skenario operasi').selectOption(value)
    }
    await scenario('validation')
    await page.getByRole('button', { name: 'Simpan draft', exact: true }).click()
    await expect(page.getByLabel('Nomor PO', { exact: true })).toHaveAttribute(
        'aria-invalid',
        'true',
    )
    await scenario('csrf')
    await page.getByRole('button', { name: 'Simpan draft', exact: true }).click()
    await expect(
        page.getByText('Sesi telah diperbarui. Periksa draft lalu simpan kembali.'),
    ).toBeVisible()
    await expect(page.getByLabel('Catatan', { exact: true })).toHaveValue('Synthetic recovery')
    await scenario('committed-timeout')
    await page.getByRole('button', { name: 'Simpan draft', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Ulangi permintaan', exact: true })).toBeVisible()
    await expect(page.getByLabel('Catatan', { exact: true })).toBeDisabled()
    await scenario('success')
    await page.getByRole('button', { name: 'Ulangi permintaan', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Detail order', exact: true })).toBeVisible()
    await page.getByRole('link', { name: 'Kembali ke daftar', exact: true }).click()
    await expect(page.getByText('1 order', { exact: true })).toBeVisible()
})
