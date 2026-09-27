import { expect, test } from '@playwright/test'
import { login, expectNoOverflow } from './session-helpers'
import type * as OrderModule from '../../../resources/js/src/api/mocks/persistence/order-repository'
import type * as AssignmentModule from '../../../resources/js/src/api/mocks/persistence/assignment-repository'
import type * as DemoModule from '../../../resources/js/src/api/mocks/persistence/demo-repository'
import type * as SessionModule from '../../../resources/js/src/api/mocks/session-fixtures'
import type * as TimberModule from '../../../resources/js/src/api/mocks/persistence/timber-product-repository'
import type * as MitraModule from '../../../resources/js/src/api/mocks/persistence/mitra-repository'
test.skip(process.env.E2E_PRODUCTION === 'true', 'Assignment mock workflow')
test('allocates two active Graders and Mitra without overwriting siblings and preserves after reload', async ({
    page,
}, info) => {
    await login(page, 'maker@woodflow.test', '/app/orders/new')
    await page.getByLabel('Nomor PO', { exact: true }).selectOption('demo-po-03')
    await page.getByRole('button', { name: 'Simpan draft', exact: true }).click()
    for (const suffix of ['01', '02']) {
        await page.getByRole('button', { name: 'Tambah alokasi', exact: true }).click()
        await page.getByLabel('Mitra', { exact: true }).selectOption('demo-mitra-' + suffix)
        await page.getByLabel('Grader', { exact: true }).selectOption('demo-grader-' + suffix)
        await page.getByLabel('Kayu', { exact: true }).selectOption('demo-timber-01')
        await page.getByLabel('Jumlah alokasi', { exact: true }).fill('1')
        await page.getByRole('button', { name: 'Simpan alokasi', exact: true }).click()
        await expect(
            page.getByRole('button', { name: 'Tambah alokasi', exact: true }),
        ).toBeVisible()
    }
    await page.reload()
    await expect(page.getByRole('button', { name: 'Edit alokasi', exact: true })).toHaveCount(2)
    await expect(page.getByText('DEMO-INV-MITRA-01', { exact: true })).toBeVisible()
    await expectNoOverflow(page)
    await page.screenshot({ path: info.outputPath('order-assignments.png'), fullPage: true })
})
test('enforces active accounts, capacity, assignment isolation and persistent lookup relations', async ({
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
        const { AssignmentRepository } = (await import(
            base + 'api/mocks/persistence/assignment-repository.ts'
        )) as typeof AssignmentModule
        const { DemoRepository } = (await import(
            base + 'api/mocks/persistence/demo-repository.ts'
        )) as typeof DemoModule
        const { sessionFixtures } = (await import(
            base + 'api/mocks/session-fixtures.ts'
        )) as typeof SessionModule
        const { TimberProductRepository } = (await import(
            base + 'api/mocks/persistence/timber-product-repository.ts'
        )) as typeof TimberModule
        const { MitraRepository } = (await import(
            base + 'api/mocks/persistence/mitra-repository.ts'
        )) as typeof MitraModule
        const options = { name: 'assignment-test-' + crypto.randomUUID() }
        const metadata = await new DemoRepository(options).initialize()
        const orders = new OrderRepository(options),
            assignments = new AssignmentRepository(options)
        const maker = sessionFixtures.find((actor) => actor.id === 'maker-demo')
        const firstActor = sessionFixtures.find((actor) => actor.id === 'grader-one')
        const secondActor = sessionFixtures.find((actor) => actor.id === 'grader-two')
        const user = sessionFixtures.find((actor) => actor.id === 'user-demo')
        if (!maker || !firstActor || !secondActor || !user) throw new Error('Missing actors')
        const signal = new AbortController().signal
        const order = await orders.mutate(
            maker,
            {
                action: 'create',
                input: { purchaseOrderId: 'demo-po-03', notes: null },
                key: 'create',
            },
            metadata.generation,
            signal,
        )
        const input = {
            orderId: order.id,
            mitraId: 'demo-mitra-01',
            graderId: 'demo-grader-01',
            timberProductId: 'demo-timber-01',
            quantity: 1,
        }
        const first = await assignments.mutate(
            maker,
            { action: 'create', input, key: 'first' },
            metadata.generation,
            signal,
        )
        const retry = await assignments.mutate(
            maker,
            { action: 'create', input, key: 'first' },
            metadata.generation,
            signal,
        )
        const second = await assignments.mutate(
            maker,
            {
                action: 'create',
                input: { ...input, mitraId: 'demo-mitra-02', graderId: 'demo-grader-02' },
                key: 'second',
            },
            metadata.generation,
            signal,
        )
        const failures: string[] = []
        async function capture(action: () => Promise<unknown>): Promise<void> {
            try {
                await action()
                failures.push('unexpected-success')
            } catch (cause) {
                failures.push((cause as { kind: string }).kind)
            }
        }
        await capture(() =>
            assignments.mutate(
                maker,
                { action: 'create', input, key: 'overflow' },
                metadata.generation,
                signal,
            ),
        )
        await capture(() =>
            assignments.mutate(
                maker,
                {
                    action: 'update',
                    id: first.id,
                    input: { ...input, version: first.version, graderId: 'demo-grader-03' },
                    key: 'inactive',
                },
                metadata.generation,
                signal,
            ),
        )
        await capture(() => assignments.get(secondActor, first.id, signal))
        const query = { page: 1, perPage: 20, sort: 'createdAt' as const, search: '' }
        const scoped = await assignments.list(firstActor, query, signal)
        const timber = new TimberProductRepository(options)
        const before = await timber.list(firstActor, query, signal, true)
        const mitras = await new MitraRepository(options).list(user, query, signal, true)
        await assignments.mutate(
            maker,
            {
                action: 'update',
                id: first.id,
                input: { ...input, version: first.version, graderId: 'demo-grader-02' },
                key: 'reassign',
            },
            metadata.generation,
            signal,
        )
        const after = await timber.list(firstActor, query, signal, true)
        const sibling = await assignments.get(maker, second.id, signal)
        const currentOrder = await orders.get(maker, order.id, signal)
        return {
            failures,
            retry: first.id === retry.id,
            scoped: scoped.meta.total,
            before: before.meta.total,
            after: after.meta.total,
            mitras: mitras.meta.total,
            sibling: sibling.version,
            orderVersion: currentOrder.version,
            leaks: JSON.stringify(scoped).includes('purchasePrice'),
        }
    })
    expect(result).toEqual({
        failures: ['conflict', 'validation', 'not-found'],
        retry: true,
        scoped: 1,
        before: 1,
        after: 0,
        mitras: 2,
        sibling: 1,
        orderVersion: 4,
        leaks: false,
    })
})
