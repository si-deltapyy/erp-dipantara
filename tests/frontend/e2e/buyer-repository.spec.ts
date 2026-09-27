import { expect, test } from '@playwright/test'
import type * as BuyerRepositoryModule from '../../../resources/js/src/api/mocks/persistence/buyer-repository'
import type * as DemoRepositoryModule from '../../../resources/js/src/api/mocks/persistence/demo-repository'
import type * as SessionFixturesModule from '../../../resources/js/src/api/mocks/session-fixtures'
import type * as TransactionModule from '../../../resources/js/src/api/mocks/persistence/transaction'
import type * as BuyerMapperModule from '../../../resources/js/src/api/buyer-mapper'
import type * as ResponseModule from '../../../resources/js/src/api/contracts/response-parsers'
import type * as BuyerMockModule from '../../../resources/js/src/api/adapters/buyers-mock'
import type * as RuntimeModule from '../../../resources/js/src/api/mocks/demo-runtime'

test.skip(process.env.E2E_PRODUCTION === 'true', 'Native IndexedDB Buyer policy and transactions')

test('enforces scope, version, atomic replay and reset generation at the adapter boundary', async ({
    page,
}) => {
    await page.goto('/app')
    const result = await page.evaluate(async () => {
        const base = 'http://127.0.0.1:5174/resources/js/src/'
        const { BuyerRepository } = (await import(
            base + 'api/mocks/persistence/buyer-repository.ts'
        )) as typeof BuyerRepositoryModule
        const { DemoRepository } = (await import(
            base + 'api/mocks/persistence/demo-repository.ts'
        )) as typeof DemoRepositoryModule
        const { sessionFixtures } = (await import(
            base + 'api/mocks/session-fixtures.ts'
        )) as typeof SessionFixturesModule
        const { createMockBuyers } = (await import(
            base + 'api/adapters/buyers-mock.ts'
        )) as typeof BuyerMockModule
        const { DemoRuntime } = (await import(
            base + 'api/mocks/demo-runtime.ts'
        )) as typeof RuntimeModule
        const { parseBuyer } = (await import(
            base + 'api/buyer-mapper.ts'
        )) as typeof BuyerMapperModule
        const { parsePage } = (await import(
            base + 'api/contracts/response-parsers.ts'
        )) as typeof ResponseModule
        const options = { name: 'buyer-policy-' + crypto.randomUUID() }
        const demo = new DemoRepository(options)
        const repository = new BuyerRepository(options)
        const runtime = new DemoRuntime(demo)
        let actor = sessionFixtures.find((user) => user.email === 'admin@woodflow.test') ?? null
        const api = createMockBuyers(runtime, () => actor, repository)
        const signal = new AbortController().signal
        const query = { page: 1, perPage: 20, search: '', sort: '-createdAt' as const }
        const pageResult = await api.list(query, signal)
        const canonical = parsePage(
            {
                ...pageResult,
                data: pageResult.data.map(({ snapshotGeneration, ...buyer }) => {
                    void snapshotGeneration
                    return buyer
                }),
            },
            parseBuyer,
        )
        const input = {
            companyName: 'Synthetic Contract Buyer',
            contactName: 'Synthetic Contact',
            phone: '0001',
            address: '',
        }
        const write = { signal, idempotencyKey: 'create-one' }
        const created = await api.create(input, write)
        const replay = await api.create(input, write)
        const kind = (cause: unknown): string => (cause as { kind: string }).kind
        const changed = await api
            .create({ ...input, companyName: 'Changed' }, write)
            .then(() => 'unexpected', kind)
        const updates = await Promise.allSettled([
            api.update(
                created.id,
                { ...input, version: 1 },
                { signal, idempotencyKey: 'update-one' },
            ),
            api.update(
                created.id,
                { ...input, version: 1 },
                { signal, idempotencyKey: 'update-two' },
            ),
        ])
        const missing = await api.get('missing', signal).then(() => 'unexpected', kind)
        actor = sessionFixtures.find((user) => user.email === 'user@woodflow.test') ?? null
        const deniedRead = await api.list(query, signal).then(() => 'unexpected', kind)
        const deniedWrite = await api
            .create(input, { signal, idempotencyKey: 'denied' })
            .then(() => 'unexpected', kind)
        const lookup = await api.lookup(query, signal)
        actor = sessionFixtures.find((user) => user.email === 'grader1@woodflow.test') ?? null
        const deniedLookup = await api.lookup(query, signal).then(() => 'unexpected', kind)
        actor = sessionFixtures.find((user) => user.email === 'admin@woodflow.test') ?? null
        const seed = pageResult.data[0]
        if (!seed) throw new Error('Missing seed')
        await runtime.reset(actor)
        const stale = await api
            .update(
                seed.id,
                {
                    companyName: seed.companyName,
                    contactName: seed.contactName,
                    phone: seed.phone,
                    address: seed.address,
                    version: seed.version,
                },
                { signal, idempotencyKey: 'stale', snapshotGeneration: seed.snapshotGeneration },
            )
            .then(() => 'unexpected', kind)
        const resetReplay = await api.create(input, write).then(() => 'unexpected', kind)
        runtime.dispose()
        return {
            total: canonical.meta.total,
            replay: created.id === replay.id,
            changed,
            successes: updates.filter((outcome) => outcome.status === 'fulfilled').length,
            conflicts: updates.filter(
                (outcome) => outcome.status === 'rejected' && kind(outcome.reason) === 'conflict',
            ).length,
            missing,
            deniedRead,
            deniedWrite,
            lookupFields: Object.keys(lookup.data[0] ?? {}).sort(),
            deniedLookup,
            stale,
            resetReplay,
        }
    })
    expect(result).toEqual({
        total: 24,
        replay: true,
        changed: 'conflict',
        successes: 1,
        conflicts: 1,
        missing: 'not-found',
        deniedRead: 'forbidden',
        deniedWrite: 'forbidden',
        lookupFields: ['id', 'label'],
        deniedLookup: 'forbidden',
        stale: 'conflict',
        resetReplay: 'conflict',
    })
})

test('upgrades version one without deleting existing data and rolls back failed Buyer writes', async ({
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
        const name = 'buyer-upgrade-' + crypto.randomUUID()
        await new Promise<void>((resolve, reject) => {
            const request = indexedDB.open(name, 1)
            request.onupgradeneeded = () => {
                for (const store of ['metadata', 'samples', 'audit', 'blobs', 'mutations'])
                    request.result.createObjectStore(store, { keyPath: 'id' })
                request.transaction?.objectStore('metadata').put({
                    id: 'dataset',
                    datasetVersion: 1,
                    generation: 'preserved-generation',
                    revision: 7,
                })
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
            ['buyers', 'samples', 'blobs'],
            'readonly',
            async (transaction) => ({
                count: await transaction.count('buyers'),
                quantity: (await transaction.get('samples', 'preserved'))?.quantity,
                blob: (await transaction.get('blobs', 'preserved-blob'))?.content,
            }),
        )
        await runDemoTransaction(
            options,
            ['buyers', 'metadata', 'buyerMutations'],
            'readwrite',
            async (transaction) => {
                await transaction.clear('buyers')
                await transaction.put('metadata', { ...metadata, revision: 999 })
                throw new DOMException('Simulated quota failure', 'QuotaExceededError')
            },
        ).catch(() => undefined)
        const after = await runDemoTransaction(
            options,
            ['buyers', 'metadata'],
            'readonly',
            async (transaction) => ({
                count: await transaction.count('buyers'),
                revision: (await transaction.get('metadata', 'dataset'))?.revision,
            }),
        )
        return {
            generation: metadata.generation,
            before: {
                count: before.count,
                quantity: before.quantity,
                blob: await before.blob?.text(),
            },
            after,
        }
    })
    expect(result).toEqual({
        generation: 'preserved-generation',
        before: { count: 24, quantity: 42, blob: 'preserved' },
        after: { count: 24, revision: 7 },
    })
})
