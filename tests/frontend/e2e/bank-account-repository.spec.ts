import { expect, test } from '@playwright/test'
import type * as BankAccountRepositoryModule from '../../../resources/js/src/api/mocks/persistence/bank-account-repository'
import type * as DemoRepositoryModule from '../../../resources/js/src/api/mocks/persistence/demo-repository'
import type * as SessionFixturesModule from '../../../resources/js/src/api/mocks/session-fixtures'
import type * as BankAccountMapperModule from '../../../resources/js/src/api/bank-account-mapper'
import type * as ResponseModule from '../../../resources/js/src/api/contracts/response-parsers'
import type * as BankAccountMockModule from '../../../resources/js/src/api/adapters/bank-accounts-mock'
import type * as RuntimeModule from '../../../resources/js/src/api/mocks/demo-runtime'

test.skip(
    process.env.E2E_PRODUCTION === 'true',
    'Native IndexedDB BankAccount policy and transactions',
)

test('enforces scope, version, atomic replay and reset generation at the adapter boundary', async ({
    page,
}) => {
    await page.goto('/app')
    const result = await page.evaluate(async () => {
        const base = 'http://127.0.0.1:5174/resources/js/src/'
        const { BankAccountRepository } = (await import(
            base + 'api/mocks/persistence/bank-account-repository.ts'
        )) as typeof BankAccountRepositoryModule
        const { DemoRepository } = (await import(
            base + 'api/mocks/persistence/demo-repository.ts'
        )) as typeof DemoRepositoryModule
        const { sessionFixtures } = (await import(
            base + 'api/mocks/session-fixtures.ts'
        )) as typeof SessionFixturesModule
        const { createMockBankAccounts } = (await import(
            base + 'api/adapters/bank-accounts-mock.ts'
        )) as typeof BankAccountMockModule
        const { DemoRuntime } = (await import(
            base + 'api/mocks/demo-runtime.ts'
        )) as typeof RuntimeModule
        const { parseBankAccount } = (await import(
            base + 'api/bank-account-mapper.ts'
        )) as typeof BankAccountMapperModule
        const { parsePage } = (await import(
            base + 'api/contracts/response-parsers.ts'
        )) as typeof ResponseModule
        const options = { name: 'bankAccount-policy-' + crypto.randomUUID() }
        const demo = new DemoRepository(options)
        const repository = new BankAccountRepository(options)
        const runtime = new DemoRuntime(demo)
        let actor = sessionFixtures.find((user) => user.email === 'admin@woodflow.test') ?? null
        const api = createMockBankAccounts(runtime, () => actor, repository)
        const signal = new AbortController().signal
        const query = { page: 1, perPage: 20, search: '', sort: '-createdAt' as const }
        const pageResult = await api.list(query, signal)
        const canonical = parsePage(
            {
                ...pageResult,
                data: pageResult.data.map(({ snapshotGeneration, ...bankAccount }) => {
                    void snapshotGeneration
                    return bankAccount
                }),
            },
            parseBankAccount,
        )
        const input = {
            bankName: 'Synthetic Contract BankAccount',
            accountNumber: '0001',
            accountHolder: 'Synthetic Owner',
            ownerType: 'company' as const,
            ownerId: null,
        }
        const write = { signal, idempotencyKey: 'create-one' }
        const created = await api.create(input, write)
        const replay = await api.create(input, write)
        const kind = (cause: unknown): string => (cause as { kind: string }).kind
        const changed = await api
            .create({ ...input, bankName: 'Changed' }, write)
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
        const immutableOwner = await api
            .update(
                created.id,
                { ...input, ownerType: 'buyer', ownerId: 'demo-buyer-01', version: 2 },
                { signal, idempotencyKey: 'immutable' },
            )
            .then(() => 'unexpected', kind)
        const invalidOwner = await api
            .create(
                { ...input, ownerType: 'buyer', ownerId: 'missing' },
                { signal, idempotencyKey: 'invalid-owner' },
            )
            .then(() => 'unexpected', kind)
        const afterInvalid = await api.get(created.id, signal)
        const missing = await api.get('missing', signal).then(() => 'unexpected', kind)
        actor = sessionFixtures.find((user) => user.email === 'user@woodflow.test') ?? null
        const deniedRead = await api.list(query, signal).then(() => 'unexpected', kind)
        const deniedWrite = await api
            .create(input, { signal, idempotencyKey: 'denied' })
            .then(() => 'unexpected', kind)
        const lookup = await api.lookup({ ...query, invoiceId: 'demo-invoice-buyer-one' }, signal)
        const hiddenLookup = await api.lookup(
            { ...query, invoiceId: 'demo-invoice-buyer-one', ownerId: 'demo-buyer-02' },
            signal,
        )
        const deniedDetail = await api.get(created.id, signal).then(() => 'unexpected', kind)
        if (!actor) throw new Error('Missing actor')
        actor = { ...actor, permissions: ['bank-accounts.read.all'] }
        const readOnly = await api.get(created.id, signal)
        const deniedUpdate = await api
            .update(
                created.id,
                { ...input, version: 2 },
                { signal, idempotencyKey: 'denied-update' },
            )
            .then(() => 'unexpected', kind)
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
                    bankName: seed.bankName,
                    accountNumber: seed.accountNumber,
                    accountHolder: seed.accountHolder,
                    ownerType: seed.ownerType,
                    ownerId: seed.ownerId,
                    version: seed.version,
                },
                { signal, idempotencyKey: 'stale', snapshotGeneration: seed.snapshotGeneration },
            )
            .then(() => 'unexpected', kind)
        const resetReplay = await api.create(input, write).then(() => 'unexpected', kind)
        runtime.dispose()
        return {
            immutableOwner,
            invalidOwner,
            unchangedVersion: afterInvalid.version,
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
            lookupTotal: lookup.meta.total,
            hiddenLookupTotal: hiddenLookup.meta.total,
            deniedDetail,
            readOnlyActions: readOnly.allowedActions,
            deniedUpdate,
            lookupIds: lookup.data.map((bankAccount) => bankAccount.id),
            stableId: updates.some(
                (outcome) => outcome.status === 'fulfilled' && outcome.value.id === created.id,
            ),
            deniedLookup,
            stale,
            resetReplay,
        }
    })
    expect(result).toEqual({
        immutableOwner: 'validation',
        invalidOwner: 'validation',
        unchangedVersion: 2,
        total: 24,
        replay: true,
        changed: 'conflict',
        successes: 1,
        conflicts: 1,
        missing: 'not-found',
        deniedRead: 'forbidden',
        deniedWrite: 'forbidden',
        lookupFields: ['id', 'label'],
        lookupTotal: 10,
        hiddenLookupTotal: 0,
        deniedDetail: 'forbidden',
        readOnlyActions: [],
        deniedUpdate: 'forbidden',
        lookupIds: expect.arrayContaining(['demo-bank-account-02']),
        stableId: true,
        deniedLookup: 'forbidden',
        stale: 'conflict',
        resetReplay: 'conflict',
    })
})
