import { expect, test } from '@playwright/test'
import type * as RepositoryModule from '../../../resources/js/src/api/mocks/persistence/purchase-order-repository'
import type * as DemoModule from '../../../resources/js/src/api/mocks/persistence/demo-repository'
import type * as SessionModule from '../../../resources/js/src/api/mocks/session-fixtures'
import type * as DraftModule from '../../../resources/js/src/core/domain/purchase-order-draft'
import type * as TransactionModule from '../../../resources/js/src/api/mocks/persistence/transaction'
import type { SessionUser } from '../../../resources/js/src/core/types/session'

test.skip(process.env.E2E_PRODUCTION === 'true', 'Native PO cross-role policy verification')
test('preserves ownership and enforces action-specific scopes for Admin, Maker and mixed permissions', async ({
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
        const { purchaseOrderDraft } = (await import(
            base + 'core/domain/purchase-order-draft.ts'
        )) as typeof DraftModule
        const { runDemoTransaction } = (await import(
            base + 'api/mocks/persistence/transaction.ts'
        )) as typeof TransactionModule
        const options = { name: 'po-processing-' + crypto.randomUUID() }
        const repository = new PurchaseOrderRepository(options)
        const metadata = await new DemoRepository(options).initialize()
        const admin = sessionFixtures.find((actor) => actor.id === 'admin-demo')
        const maker = sessionFixtures.find((actor) => actor.id === 'maker-demo')
        const user = sessionFixtures.find((actor) => actor.id === 'user-demo')
        if (!admin || !maker || !user) throw new Error('Missing actors')
        const signal = new AbortController().signal
        const query = { page: 1, perPage: 100, search: '', sort: '-createdAt' as const }
        const kind = (cause: unknown): string => (cause as { kind: string }).kind
        const foreign = await repository.get(admin, 'demo-po-26', signal)
        const input = purchaseOrderDraft(foreign)
        const write = (
            actor: SessionUser,
            action: 'create' | 'update' | 'submit',
            id = foreign.id,
            version = foreign.version,
        ) =>
            repository.mutate(
                actor,
                {
                    action,
                    ...(action === 'create' ? {} : { id }),
                    input:
                        action === 'submit'
                            ? { version }
                            : {
                                  ...input,
                                  ...(action === 'create'
                                      ? { number: 'DEMO-ADMIN-CREATED' }
                                      : { version }),
                                  notes: 'Admin processing',
                              },
                    key: crypto.randomUUID(),
                },
                metadata.generation,
                signal,
            )
        const makerList = await repository.list(maker, query, signal)
        const makerDetail = await repository.get(maker, foreign.id, signal)
        const makerWrites = await Promise.all(
            (['create', 'update', 'submit'] as const).map((action) =>
                write(maker, action).then(() => 'unexpected', kind),
            ),
        )
        const noPermission = { ...admin, permissions: [] }
        const deniedList = await repository
            .list(noPermission, query, signal)
            .then(() => 'unexpected', kind)
        const deniedWrites = await Promise.all(
            (['create', 'update', 'submit'] as const).map((action) =>
                write(noPermission, action).then(() => 'unexpected', kind),
            ),
        )
        const mixed = {
            ...user,
            roles: ['user', 'maker'],
            permissions: [...new Set([...user.permissions, ...maker.permissions])],
        }
        const mixedDetail = await repository.get(mixed, foreign.id, signal)
        const mixedForeign = await write(mixed, 'update').then(() => 'unexpected', kind)
        const mixedOwn = await repository.get(mixed, 'demo-po-01', signal)
        const updated = await write(admin, 'update')
        const submitted = await write(admin, 'submit', updated.id, updated.version)
        const reloaded = await repository.get(maker, submitted.id, signal)
        const created = await write(admin, 'create')
        const userForeign = await repository
            .get(user, created.id, signal)
            .then(() => 'unexpected', kind)
        const userList = await repository.list(user, query, signal)
        const locked = await Promise.all(
            ['demo-po-02', 'demo-po-03', 'demo-po-05'].map((id) =>
                write(admin, 'update', id).then(() => 'unexpected', kind),
            ),
        )
        const rejected = await repository.get(admin, 'demo-po-04', signal)
        const persisted = await runDemoTransaction(
            options,
            ['metadata', 'purchaseOrderMutations', 'audit'],
            'readonly',
            async (transaction) => ({
                audits: await transaction.list('audit'),
                receipts: await transaction.count('purchaseOrderMutations'),
                metadata: await transaction.get('metadata', 'dataset'),
            }),
        )
        return {
            makerTotal: makerList.meta.total,
            makerOwners: [...new Set(makerList.data.map((order) => order.createdByUserId))].sort(),
            makerActions: makerDetail.allowedActions,
            makerWrites,
            deniedList,
            deniedWrites,
            mixedActions: mixedDetail.allowedActions,
            mixedForeign,
            mixedOwnActions: mixedOwn.allowedActions,
            creatorPreserved: updated.createdByUserId === foreign.createdByUserId,
            submitter: submitted.submittedByUserId,
            reloaded: [reloaded.status, reloaded.version, reloaded.notes],
            createdOwner: created.createdByUserId,
            createdSubmitter: created.submittedByUserId,
            userForeign,
            userTotal: userList.meta.total,
            locked,
            rejectedActions: rejected.allowedActions,
            auditActors: persisted.audits.map((audit) => audit.actorId),
            receipts: persisted.receipts,
            revisionDelta: (persisted.metadata?.revision ?? 0) - metadata.revision,
        }
    })
    expect(result).toEqual({
        makerTotal: 26,
        makerOwners: ['multiple-demo', 'user-demo'],
        makerActions: [],
        makerWrites: ['forbidden', 'forbidden', 'forbidden'],
        deniedList: 'forbidden',
        deniedWrites: ['forbidden', 'forbidden', 'forbidden'],
        mixedActions: [],
        mixedForeign: 'not-found',
        mixedOwnActions: ['update', 'submit'],
        creatorPreserved: true,
        submitter: 'admin-demo',
        reloaded: ['submitted', 3, 'Admin processing'],
        createdOwner: 'admin-demo',
        createdSubmitter: null,
        userForeign: 'not-found',
        userTotal: 25,
        locked: ['conflict', 'conflict', 'conflict'],
        rejectedActions: ['update', 'submit'],
        auditActors: ['admin-demo', 'admin-demo', 'admin-demo'],
        receipts: 3,
        revisionDelta: 3,
    })
})
