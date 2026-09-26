import { expect, test } from '@playwright/test'
import type * as RepositoryModule from '../../../resources/js/src/api/mocks/persistence/purchase-order-repository'
import type * as DemoModule from '../../../resources/js/src/api/mocks/persistence/demo-repository'
import type * as SessionModule from '../../../resources/js/src/api/mocks/session-fixtures'
import type * as MockModule from '../../../resources/js/src/api/adapters/purchase-orders-mock'
import type * as RuntimeModule from '../../../resources/js/src/api/mocks/demo-runtime'
import type * as TransactionModule from '../../../resources/js/src/api/mocks/persistence/transaction'

test.skip(process.env.E2E_PRODUCTION === 'true', 'Native PO transaction verification')
test('enforces ownership, concurrency, idempotency, labels, totals and generation boundaries', async ({
    page,
}) => {
    await page.goto('/app')
    const result = await page.evaluate(async () => {
        const base = new URL(
            '/resources/js/src/',
            document.querySelector<HTMLScriptElement>('script[src*="/@vite/client"]')?.src ??
                location.origin,
        ).href
        const { PurchaseOrderRepository } = (await import(
            base + 'api/mocks/persistence/purchase-order-repository.ts'
        )) as typeof RepositoryModule
        const { DemoRepository } = (await import(
            base + 'api/mocks/persistence/demo-repository.ts'
        )) as typeof DemoModule
        const { sessionFixtures } = (await import(
            base + 'api/mocks/session-fixtures.ts'
        )) as typeof SessionModule
        const { createMockPurchaseOrders } = (await import(
            base + 'api/adapters/purchase-orders-mock.ts'
        )) as typeof MockModule
        const { DemoRuntime } = (await import(
            base + 'api/mocks/demo-runtime.ts'
        )) as typeof RuntimeModule
        const { runDemoTransaction } = (await import(
            base + 'api/mocks/persistence/transaction.ts'
        )) as typeof TransactionModule
        const options = { name: 'po-repository-' + crypto.randomUUID() }
        const runtime = new DemoRuntime(new DemoRepository(options))
        const user = sessionFixtures.find((actor) => actor.id === 'user-demo')
        const admin = sessionFixtures.find((actor) => actor.id === 'admin-demo')
        const other = sessionFixtures.find((actor) => actor.id === 'multiple-demo')
        if (!user || !admin || !other) throw new Error('Missing actors')
        let actor = user
        const api = createMockPurchaseOrders(
            runtime,
            () => actor,
            new PurchaseOrderRepository(options),
        )
        const signal = new AbortController().signal
        const write = (key: string) => ({ signal, idempotencyKey: key })
        const kind = (cause: unknown): string => (cause as { kind: string }).kind
        const query = { page: 1, perPage: 100, search: '', sort: '-createdAt' as const }
        const initial = await api.list(query, signal)
        const input = {
            buyerId: 'demo-buyer-24',
            number: 'Synthetic PO',
            orderDate: '2026-09-26',
            notes: null,
            lines: [{ timberProductId: 'demo-timber-24', quantity: 3, unitPrice: '0.10' }],
        }
        const created = await api.create(input, write('create'))
        const replay = await api.create(input, write('create'))
        const altered = await api
            .create({ ...input, lines: [{ ...input.lines[0], quantity: 4 }] }, write('create'))
            .then(() => 'unexpected', kind)
        actor = other
        const scoped = await api.list(query, signal)
        const foreignGet = await api.get(created.id, signal).then(() => 'unexpected', kind)
        const foreignWrite = await api
            .update(created.id, { ...input, version: 1 }, write('foreign'))
            .then(() => 'unexpected', kind)
        actor = { ...user, roles: ['admin'], permissions: [] }
        const denied = await api
            .submit(created.id, { version: 1 }, write('denied'))
            .then(() => 'unexpected', kind)
        actor = user
        const missingId = await api
            .update('', { ...input, version: 1 }, write('empty-id'))
            .then(() => 'unexpected', kind)
        const races = await Promise.allSettled([
            api.update(created.id, { ...input, notes: 'one', version: 1 }, write('edit-one')),
            api.update(created.id, { ...input, notes: 'two', version: 1 }, write('edit-two')),
        ])
        const submitted = await api.submit(created.id, { version: 2 }, write('submit'))
        const submitReplay = await api.submit(created.id, { version: 2 }, write('submit'))
        const locked = await api
            .update(created.id, { ...input, version: 3 }, write('locked'))
            .then(() => 'unexpected', kind)
        const duplicateNumber = await api
            .create(input, write('duplicate-number'))
            .then(() => 'unexpected', kind)
        const numberRaces = await Promise.allSettled([
            api.create({ ...input, number: 'Concurrent unique' }, write('number-one')),
            api.create({ ...input, number: 'Concurrent unique' }, write('number-two')),
        ])
        const counters = await runDemoTransaction(
            options,
            ['purchase-orders', 'purchaseOrderMutations', 'audit'],
            'readonly',
            async (transaction) => ({
                orders: await transaction.count('purchase-orders'),
                receipts: await transaction.count('purchaseOrderMutations'),
                audits: await transaction.count('audit'),
            }),
        )
        await runDemoTransaction(options, ['buyers'], 'readwrite', async (transaction) => {
            const buyer = await transaction.get('buyers', input.buyerId)
            if (!buyer) throw new Error('Missing buyer')
            await transaction.put('buyers', { ...buyer, companyName: 'Updated Synthetic Buyer' })
        })
        const relabeled = await api.get(created.id, signal)
        actor = admin
        const all = await api.list(query, signal)
        const missingReference = await api
            .create(
                { ...input, number: 'Missing reference', buyerId: 'missing' },
                write('missing-ref'),
            )
            .then(() => 'unexpected', kind)
        await runtime.reset(admin)
        actor = user
        const resetReplay = await api.create(input, write('create')).then(() => 'unexpected', kind)
        runtime.dispose()
        return {
            own: initial.meta.total,
            other: scoped.meta.total,
            ownIds: initial.data.every((order) => order.createdByUserId === user.id),
            replay: replay.id === created.id,
            total: created.totalAmount,
            label: created.buyerName,
            timber: created.lines[0]?.timberProductName,
            altered,
            foreignGet,
            foreignWrite,
            missingId,
            denied,
            races: races
                .map((race) => (race.status === 'fulfilled' ? 'saved' : kind(race.reason)))
                .sort(),
            status: submitted.status,
            actions: submitted.allowedActions,
            submitReplay: submitReplay.version === submitted.version,
            locked,
            counters,
            duplicateNumber,
            numberRaces: numberRaces
                .map((race) => (race.status === 'fulfilled' ? 'saved' : kind(race.reason)))
                .sort(),
            labelUpdated: relabeled.buyerName,
            all: all.meta.total,
            missingReference,
            resetReplay,
        }
    })
    expect(result).toEqual({
        own: 25,
        other: 1,
        ownIds: true,
        replay: true,
        total: '0.30',
        label: 'Perusahaan Simulasi 24',
        timber: 'Kayu Simulasi 24',
        altered: 'conflict',
        foreignGet: 'not-found',
        foreignWrite: 'not-found',
        missingId: 'validation',
        denied: 'forbidden',
        races: ['conflict', 'saved'],
        status: 'submitted',
        actions: [],
        submitReplay: true,
        locked: 'conflict',
        counters: { orders: 28, receipts: 4, audits: 4 },
        duplicateNumber: 'validation',
        numberRaces: ['saved', 'validation'],
        labelUpdated: 'Updated Synthetic Buyer',
        all: 28,
        missingReference: 'validation',
        resetReplay: 'conflict',
    })
})
