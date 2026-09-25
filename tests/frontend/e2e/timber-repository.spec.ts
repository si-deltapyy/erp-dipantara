import { expect, test } from '@playwright/test'
import type * as TimberModule from '../../../resources/js/src/api/mocks/persistence/timber-product-repository'
import type * as DemoModule from '../../../resources/js/src/api/mocks/persistence/demo-repository'
import type * as SessionModule from '../../../resources/js/src/api/mocks/session-fixtures'
import type * as AdapterModule from '../../../resources/js/src/api/adapters/timber-products-mock'
import type * as RuntimeModule from '../../../resources/js/src/api/mocks/demo-runtime'

test.skip(process.env.E2E_PRODUCTION === 'true', 'Timber IndexedDB and adapter policies')
test('enforces price redaction, assignment scopes, concurrency, replay and reset', async ({
    page,
}) => {
    await page.goto('/app')
    const result = await page.evaluate(async () => {
        const base = 'http://127.0.0.1:5174/resources/js/src/'
        const { TimberProductRepository } = (await import(
            base + 'api/mocks/persistence/timber-product-repository.ts'
        )) as typeof TimberModule
        const { DemoRepository } = (await import(
            base + 'api/mocks/persistence/demo-repository.ts'
        )) as typeof DemoModule
        const { sessionFixtures } = (await import(
            base + 'api/mocks/session-fixtures.ts'
        )) as typeof SessionModule
        const { createMockTimberProducts } = (await import(
            base + 'api/adapters/timber-products-mock.ts'
        )) as typeof AdapterModule
        const { DemoRuntime } = (await import(
            base + 'api/mocks/demo-runtime.ts'
        )) as typeof RuntimeModule
        const options = { name: 'timber-policy-' + crypto.randomUUID() }
        const runtime = new DemoRuntime(new DemoRepository(options))
        const findActor = (id: string) => sessionFixtures.find((user) => user.id === id) ?? null
        let actor = findActor('admin-demo')
        const api = createMockTimberProducts(
            runtime,
            () => actor,
            new TimberProductRepository(options),
        )
        const signal = new AbortController().signal
        const query = { page: 1, perPage: 100, search: '', sort: '-createdAt' as const }
        const initial = await api.list(query, signal)
        const input = {
            name: 'Synthetic Timber',
            gradeCode: 'TEST',
            diameterCm: '20.00',
            lengthM: '2.00',
            purchasePrice: '1.00',
            salePrice: '2.00',
        }
        const write = { signal, idempotencyKey: 'one' }
        const created = await api.create(input, write)
        const replay = await api.create(input, write)
        const kind = (cause: unknown): string => (cause as { kind: string }).kind
        const changed = await api
            .create({ ...input, lengthM: '3.00' }, write)
            .then(() => 'unexpected', kind)
        const writes = await Promise.allSettled(
            ['a', 'b'].map((key) =>
                api.update(
                    created.id,
                    { ...input, diameterCm: '30.00', version: 1 },
                    { signal, idempotencyKey: key },
                ),
            ),
        )
        const updated = await api.get(created.id, signal)
        const missing = await api.get('missing', signal).then(() => 'unexpected', kind)
        if (!actor) throw new Error('Missing actor')
        actor = {
            ...actor,
            permissions: [
                'timber-products.read.all',
                'timber-products.create.all',
                'timber-products.update.all',
            ],
        }
        const redacted = await api.get(created.id, signal)
        const redactedList = await api.list(query, signal)
        const deniedWrite = await api
            .create(input, { signal, idempotencyKey: 'denied' })
            .then(() => 'unexpected', kind)
        const deniedUpdate = await api
            .update(
                created.id,
                { ...input, version: 2 },
                { signal, idempotencyKey: 'denied-update' },
            )
            .then(() => 'unexpected', kind)
        actor = findActor('user-demo')
        const own = await api.lookup(query, signal)
        const deniedRead = await api.list(query, signal).then(() => 'unexpected', kind)
        actor = findActor('grader-one')
        const assigned = await api.lookup(query, signal)
        const hidden = await api.lookup({ ...query, search: 'Simulasi 02' }, signal)
        const deniedDetail = await api.get('demo-timber-01', signal).then(() => 'unexpected', kind)
        actor = findActor('grader-two')
        const second = await api.lookup(query, signal)
        actor = findActor('admin-demo')
        const seed = initial.data[0]
        if (!seed) throw new Error('Missing seed')
        await runtime.reset(actor)
        const stale = await api
            .update(
                seed.id,
                { ...input, version: seed.version },
                { signal, idempotencyKey: 'stale', snapshotGeneration: seed.snapshotGeneration },
            )
            .then(() => 'unexpected', kind)
        const resetReplay = await api.create(input, write).then(() => 'unexpected', kind)
        runtime.dispose()
        return {
            total: initial.meta.total,
            replay: replay.id === created.id,
            createdVolume: created.volumeM3,
            updatedVolume: updated.volumeM3,
            version: updated.version,
            changed,
            successes: writes.filter((entry) => entry.status === 'fulfilled').length,
            conflicts: writes.filter(
                (entry) => entry.status === 'rejected' && kind(entry.reason) === 'conflict',
            ).length,
            missing,
            deniedWrite,
            deniedUpdate,
            deniedRead,
            deniedDetail,
            priceLeak:
                'purchasePrice' in redacted ||
                'salePrice' in redacted ||
                redactedList.data.some(
                    (record) => 'purchasePrice' in record || 'salePrice' in record,
                ),
            actions: redacted.allowedActions,
            ownTotal: own.meta.total,
            assignedIds: assigned.data.map((record) => record.id),
            secondIds: second.data.map((record) => record.id),
            hiddenTotal: hidden.meta.total,
            lookupFields: Object.keys(assigned.data[0] ?? {}).sort(),
            stale,
            resetReplay,
        }
    })
    expect(result).toEqual({
        total: 24,
        replay: true,
        createdVolume: '0.062832',
        updatedVolume: '0.141372',
        version: 2,
        changed: 'conflict',
        successes: 1,
        conflicts: 1,
        missing: 'not-found',
        deniedWrite: 'forbidden',
        deniedUpdate: 'forbidden',
        deniedRead: 'forbidden',
        deniedDetail: 'forbidden',
        priceLeak: false,
        actions: [],
        ownTotal: 25,
        assignedIds: ['demo-timber-01'],
        secondIds: ['demo-timber-02'],
        hiddenTotal: 0,
        lookupFields: ['id', 'label'],
        stale: 'conflict',
        resetReplay: 'conflict',
    })
})
