import type * as DemoRepositoryModule from '@/api/mocks/persistence/demo-repository'
import type * as SessionFixturesModule from '@/api/mocks/session-fixtures'
import type * as DemoTransactionModule from '@/api/mocks/persistence/transaction'
import type * as DemoDatabaseModule from '@/api/mocks/persistence/database'
import { test, expect } from '@playwright/test'

test.skip(process.env.E2E_PRODUCTION === 'true', 'Development IndexedDB repository only')
test.beforeEach(async ({ page }) => {
    await page.goto('/app/login')
})

test('enforces atomic version checks, scope, idempotency, and reset generations in real IndexedDB', async ({
    page,
}) => {
    const result = await page.evaluate(async () => {
        const base = 'http://127.0.0.1:5174/resources/js/src/'
        const { DemoRepository } = (await import(
            base + 'api/mocks/persistence/demo-repository.ts'
        )) as typeof DemoRepositoryModule
        const { sessionFixtures } = (await import(
            base + 'api/mocks/session-fixtures.ts'
        )) as typeof SessionFixturesModule
        const repository = new DemoRepository({ name: 'test-repository-' + crypto.randomUUID() })
        const admin = sessionFixtures.find((user) => user.id === 'admin-demo') ?? null
        const grader = sessionFixtures.find((user) => user.id === 'grader-one') ?? null
        await repository.initialize()
        const initial = await repository.read(admin)
        const input = {
            id: 'demo-sample-one',
            quantity: 1,
            version: 1,
            generation: initial.metadata.generation,
            idempotencyKey: 'attempt-one',
        }
        await repository.update(admin, input)
        const replay = await repository.update(admin, input)
        const concurrent = { ...input, version: 2, quantity: 2 }
        const attempts = await Promise.allSettled([
            repository.update(admin, { ...concurrent, idempotencyKey: 'attempt-two' }),
            repository.update(admin, { ...concurrent, idempotencyKey: 'attempt-three' }),
        ])
        const changed = await repository
            .update(admin, { ...input, quantity: 9 })
            .catch((error: unknown) => (error as { kind: string }).kind)
        const outside = await repository
            .update(grader, { ...input, id: 'demo-sample-two' })
            .catch((error: unknown) => (error as { kind: string }).kind)
        const scoped = await repository.read(grader)
        await repository.reset()
        const stale = await repository
            .update(admin, { ...input, idempotencyKey: 'after-reset' })
            .catch((error: unknown) => (error as { kind: string }).kind)
        const reset = await repository.read(admin)
        return {
            statuses: attempts.map((attempt) => attempt.status),
            replay,
            changed,
            outside,
            ids: scoped.samples.map((sample) => sample.id),
            stale,
            quantity: reset.samples[0]?.quantity,
            differentGeneration: reset.metadata.generation !== initial.metadata.generation,
        }
    })
    expect(result.statuses.sort()).toEqual(['fulfilled', 'rejected'])
    expect(result.replay).toMatchObject({ quantity: 1, version: 2 })
    expect(result.changed).toBe('conflict')
    expect(result.outside).toBe('not-found')
    expect(result.ids).toEqual(['demo-sample-one'])
    expect(result.stale).toBe('conflict')
    expect(result.quantity).toBe(0)
    expect(result.differentGeneration).toBe(true)
})

test('rolls back multi-store writes and a partial reset on failure while retaining Blob data', async ({
    page,
}) => {
    const result = await page.evaluate(async () => {
        const base = 'http://127.0.0.1:5174/resources/js/src/api/mocks/persistence/'
        const { DemoRepository } = (await import(
            base + 'demo-repository.ts'
        )) as typeof DemoRepositoryModule
        const { runDemoTransaction } = (await import(
            base + 'transaction.ts'
        )) as typeof DemoTransactionModule
        const options = { name: 'test-rollback-' + crypto.randomUUID() }
        await new DemoRepository(options).initialize()
        const failed = await runDemoTransaction(
            options,
            ['samples', 'audit'],
            'readwrite',
            async (transaction) => {
                const sample = await transaction.get('samples', 'demo-sample-one')
                if (!sample) throw new Error('Fixture missing')
                await transaction.put('samples', { ...sample, quantity: 99 })
                await transaction.put('audit', {
                    id: 'partial',
                    sampleId: sample.id,
                    actorId: 'admin-demo',
                    version: 2,
                })
                throw new DOMException('Injected storage failure', 'QuotaExceededError')
            },
        ).catch((error: unknown) => (error as { kind: string }).kind)
        await runDemoTransaction(
            options,
            ['samples', 'blobs'],
            'readwrite',
            async (transaction) => {
                await transaction.clear('samples')
                await transaction.clear('blobs')
                throw new Error('Injected reset failure')
            },
        ).catch(() => undefined)
        return runDemoTransaction(
            options,
            ['samples', 'audit', 'blobs'],
            'readonly',
            async (transaction) => {
                const sample = await transaction.get('samples', 'demo-sample-one')
                const audit = await transaction.list('audit')
                const attachment = await transaction.get('blobs', 'demo-attachment-one')
                return {
                    failed,
                    quantity: sample?.quantity,
                    auditCount: audit.length,
                    attachment: await attachment?.content.text(),
                }
            },
        )
    })
    expect(result).toEqual({
        failed: 'quota',
        quantity: 0,
        auditCount: 0,
        attachment: 'Synthetic persistence fixture',
    })
})

test('requires explicit reset for incompatible datasets and reports blocked or unavailable storage', async ({
    page,
}) => {
    const result = await page.evaluate(async () => {
        const base = 'http://127.0.0.1:5174/resources/js/src/api/mocks/persistence/'
        const { DemoRepository } = (await import(
            base + 'demo-repository.ts'
        )) as typeof DemoRepositoryModule
        const { runDemoTransaction } = (await import(
            base + 'transaction.ts'
        )) as typeof DemoTransactionModule
        const { openDemoDatabase } = (await import(
            base + 'database.ts'
        )) as typeof DemoDatabaseModule
        const options = { name: 'test-upgrade-' + crypto.randomUUID() }
        const repository = new DemoRepository(options)
        await repository.initialize()
        await runDemoTransaction(options, ['metadata'], 'readwrite', async (transaction) => {
            await transaction.put('metadata', {
                id: 'dataset',
                datasetVersion: 999,
                revision: 1,
                generation: 'legacy',
            })
        })
        const incompatible = await repository
            .initialize()
            .catch((error: unknown) => (error as { kind: string }).kind)
        const preserved = await runDemoTransaction(
            options,
            ['metadata'],
            'readonly',
            (transaction) => transaction.get('metadata', 'dataset'),
        )
        await repository.reset()
        const blocker = await new Promise<IDBDatabase>((resolve) => {
            const request = indexedDB.open(options.name, 4)
            request.onsuccess = () => resolve(request.result)
        })
        const upgradeFactory = new Proxy(indexedDB, {
            get(target, property) {
                if (property === 'open') return (name: string) => target.open(name, 5)
                return Reflect.get(target, property)
            },
        })
        const blocked = await openDemoDatabase({ ...options, factory: upgradeFactory }).catch(
            (error: unknown) => (error as { kind: string }).kind,
        )
        blocker.close()
        const deniedFactory = new Proxy(indexedDB, {
            get(target, property) {
                if (property === 'open')
                    return () => {
                        throw new DOMException('Denied', 'SecurityError')
                    }
                return Reflect.get(target, property)
            },
        })
        const unavailable = await openDemoDatabase({ factory: deniedFactory }).catch(
            (error: unknown) => (error as { kind: string }).kind,
        )
        return {
            incompatible,
            preserved: preserved?.datasetVersion,
            blocked: typeof blocked === 'string' ? blocked : 'unexpected',
            unavailable: typeof unavailable === 'string' ? unavailable : 'unexpected',
        }
    })
    expect(result).toEqual({
        incompatible: 'incompatible',
        preserved: 999,
        blocked: 'blocked',
        unavailable: 'unavailable',
    })
})
