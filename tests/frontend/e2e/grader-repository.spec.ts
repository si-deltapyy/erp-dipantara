import { expect, test } from '@playwright/test'
import type * as RepositoryModule from '../../../resources/js/src/api/mocks/persistence/grader-repository'
import type * as DemoModule from '../../../resources/js/src/api/mocks/persistence/demo-repository'
import type * as SessionModule from '../../../resources/js/src/api/mocks/session-fixtures'
import type * as MockModule from '../../../resources/js/src/api/adapters/graders-mock'
import type * as RuntimeModule from '../../../resources/js/src/api/mocks/demo-runtime'
import type * as TransactionModule from '../../../resources/js/src/api/mocks/persistence/transaction'

test.skip(process.env.E2E_PRODUCTION === 'true', 'Native Grader transactions')

test('serializes duplicate emails, provisioning replay, locked edits and stale generations', async ({
    page,
}) => {
    await page.goto('/app')
    const result = await page.evaluate(async () => {
        const base = new URL(
            '/resources/js/src/',
            document.querySelector<HTMLScriptElement>('script[src*="/@vite/client"]')?.src ??
                location.origin,
        ).href
        const { GraderRepository } = (await import(
            base + 'api/mocks/persistence/grader-repository.ts'
        )) as typeof RepositoryModule
        const { DemoRepository } = (await import(
            base + 'api/mocks/persistence/demo-repository.ts'
        )) as typeof DemoModule
        const { sessionFixtures } = (await import(
            base + 'api/mocks/session-fixtures.ts'
        )) as typeof SessionModule
        const { createMockGraders } = (await import(
            base + 'api/adapters/graders-mock.ts'
        )) as typeof MockModule
        const { DemoRuntime } = (await import(
            base + 'api/mocks/demo-runtime.ts'
        )) as typeof RuntimeModule
        const { runDemoTransaction } = (await import(
            base + 'api/mocks/persistence/transaction.ts'
        )) as typeof TransactionModule
        const options = { name: 'grader-policy-' + crypto.randomUUID() }
        const runtime = new DemoRuntime(new DemoRepository(options))
        let actor = sessionFixtures.find((user) => user.email === 'admin@woodflow.test') ?? null
        const admin = actor
        const api = createMockGraders(runtime, () => actor, new GraderRepository(options))
        const signal = new AbortController().signal
        const write = (key: string) => ({ signal, idempotencyKey: key })
        const kind = (cause: unknown): string => (cause as { kind: string }).kind
        const query = { page: 1, perPage: 20, search: '', sort: '-createdAt' as const }
        const initial = await api.list(query, signal)
        const input = {
            name: 'Synthetic Grader',
            email: ' Unique@Woodflow.Test ',
            phone: '',
            address: '',
        }
        const created = await api.create(input, write('create'))
        const replay = await api.create(input, write('create'))
        const duplicate = await api
            .create({ ...input, email: 'UNIQUE@woodflow.test' }, write('duplicate'))
            .then(() => 'unexpected', kind)
        const races = await Promise.allSettled([
            api.create({ ...input, email: 'race@woodflow.test' }, write('race-one')),
            api.create({ ...input, email: 'RACE@woodflow.test' }, write('race-two')),
        ])
        const duplicateEdit = await api
            .update(
                created.id,
                { ...input, email: 'grader1@woodflow.test', version: 1 },
                write('duplicate-edit'),
            )
            .then(() => 'unexpected', kind)
        const edited = await api.update(
            created.id,
            { ...input, email: 'before@woodflow.test', version: 1 },
            write('edit'),
        )
        const staleProvision = await api
            .provision(created.id, { version: 1 }, write('stale'))
            .then(() => 'unexpected', kind)
        const pending = await api.provision(created.id, { version: 2 }, write('provision'))
        const repeated = await api.provision(created.id, { version: 2 }, write('provision'))
        const reprovision = await api
            .provision(created.id, { version: 3 }, write('again'))
            .then(() => 'unexpected', kind)
        const changedReplay = await api
            .provision(created.id, { version: 3 }, write('provision'))
            .then(() => 'unexpected', kind)
        const locked = await api
            .update(created.id, { ...input, version: 3 }, write('locked'))
            .then(() => 'unexpected', kind)
        const profile = await api.update(
            created.id,
            { ...input, email: 'before@woodflow.test', phone: '0001', version: 3 },
            write('profile'),
        )
        const active = await api.get('demo-grader-01', signal)
        const activeProvision = await api
            .provision(active.id, { version: active.version }, write('active'))
            .then(() => 'unexpected', kind)
        const activeEmail = await api
            .update(
                active.id,
                {
                    name: active.name,
                    email: 'new@woodflow.test',
                    phone: '',
                    address: '',
                    version: active.version,
                },
                write('active-email'),
            )
            .then(() => 'unexpected', kind)
        const activeProfile = await api.update(
            active.id,
            {
                name: active.name,
                email: active.email,
                phone: '0002',
                address: '',
                version: active.version,
            },
            write('active-profile'),
        )
        const receipts = await runDemoTransaction(
            options,
            ['graders', 'graderMutations', 'audit'],
            'readonly',
            async (transaction) => ({
                count: await transaction.count('graders'),
                receipts: await transaction.count('graderMutations'),
                audit: await transaction.count('audit'),
            }),
        )
        if (!admin) throw new Error('Missing admin')
        actor = { ...admin, permissions: ['graders.read.all', 'graders.lookup.all'] }
        const readOnly = await api.get(created.id, signal)
        const deniedProvision = await api
            .provision(created.id, { version: 4 }, write('denied'))
            .then(() => 'unexpected', kind)
        const lookup = await api.lookup(query, signal)
        const emailLookup = await api.lookup({ ...query, search: 'before@woodflow.test' }, signal)
        const emailSearch = await api.list({ ...query, search: 'before@woodflow.test' }, signal)
        actor = { ...admin, permissions: ['graders.lookup.own'] }
        const deniedLookup = await api.lookup(query, signal).then(() => 'unexpected', kind)
        actor = admin
        const missing = await api
            .provision('missing', { version: 1 }, write('missing'))
            .then(() => 'unexpected', kind)
        const seed = initial.data[0]
        if (!seed) throw new Error('Missing seed')
        await runtime.reset(actor)
        const staleGeneration = await api
            .provision(
                seed.id,
                { version: seed.version },
                { ...write('reset-stale'), snapshotGeneration: seed.snapshotGeneration },
            )
            .then(() => 'unexpected', kind)
        const resetReplay = await api
            .provision(created.id, { version: 2 }, write('provision'))
            .then(() => 'unexpected', kind)
        runtime.dispose()
        return {
            total: initial.meta.total,
            normalized: created.email,
            initialStatus: created.provisioningStatus,
            initialUser: created.userId,
            replay: created.id === replay.id,
            duplicate,
            raceSuccess: races.filter((outcome) => outcome.status === 'fulfilled').length,
            raceValidation: races.filter(
                (outcome) => outcome.status === 'rejected' && kind(outcome.reason) === 'validation',
            ).length,
            duplicateEdit,
            editedEmail: edited.email,
            staleProvision,
            status: pending.provisioningStatus,
            userId: pending.userId,
            provisionReplay: pending.version === repeated.version,
            reprovision,
            changedReplay,
            locked,
            phone: profile.phone,
            profileVersion: profile.version,
            activeIdentity: active.id !== active.userId,
            activeProvision,
            activeEmail,
            activeStatus: activeProfile.provisioningStatus,
            receipts,
            readOnlyActions: readOnly.allowedActions,
            deniedProvision,
            lookupFields: Object.keys(lookup.data[0] ?? {}).sort(),
            lookupTotal: lookup.meta.total,
            emailLookup: emailLookup.meta.total,
            emailSearch: emailSearch.meta.total,
            deniedLookup,
            missing,
            staleGeneration,
            resetReplay,
        }
    })
    expect(result).toEqual({
        total: 24,
        normalized: 'unique@woodflow.test',
        initialStatus: 'not_provisioned',
        initialUser: null,
        replay: true,
        duplicate: 'validation',
        raceSuccess: 1,
        raceValidation: 1,
        duplicateEdit: 'validation',
        editedEmail: 'before@woodflow.test',
        staleProvision: 'conflict',
        status: 'pending_activation',
        userId: null,
        provisionReplay: true,
        reprovision: 'conflict',
        changedReplay: 'conflict',
        locked: 'validation',
        phone: '0001',
        profileVersion: 4,
        activeIdentity: true,
        activeProvision: 'conflict',
        activeEmail: 'validation',
        activeStatus: 'active',
        receipts: { count: 26, receipts: 6, audit: 6 },
        readOnlyActions: [],
        deniedProvision: 'forbidden',
        lookupFields: ['id', 'label'],
        lookupTotal: 26,
        emailLookup: 0,
        emailSearch: 1,
        deniedLookup: 'forbidden',
        missing: 'not-found',
        staleGeneration: 'conflict',
        resetReplay: 'conflict',
    })
})
