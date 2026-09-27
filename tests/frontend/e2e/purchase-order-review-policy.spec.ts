import { expect, test } from '@playwright/test'
import type * as RepositoryModule from '../../../resources/js/src/api/mocks/persistence/purchase-order-repository'
import type * as DemoModule from '../../../resources/js/src/api/mocks/persistence/demo-repository'
import type * as SessionModule from '../../../resources/js/src/api/mocks/session-fixtures'
import type * as DraftModule from '../../../resources/js/src/core/domain/purchase-order-draft'
import type * as TransactionModule from '../../../resources/js/src/api/mocks/persistence/transaction'
import type { SessionUser } from '../../../resources/js/src/core/types/session'

test.skip(process.env.E2E_PRODUCTION === 'true', 'Native PO review persistence and policy')
test('reviews atomically with self-review protection, version conflicts and legacy normalization', async ({
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
        const options = { name: 'po-review-' + crypto.randomUUID() }
        const repository = new PurchaseOrderRepository(options)
        const metadata = await new DemoRepository(options).initialize()
        const supervisor = sessionFixtures.find((actor) => actor.id === 'supervisor-demo')
        const admin = sessionFixtures.find((actor) => actor.id === 'admin-demo')
        const user = sessionFixtures.find((actor) => actor.id === 'user-demo')
        const maker = sessionFixtures.find((actor) => actor.id === 'maker-demo')
        if (!supervisor || !admin || !user || !maker) throw new Error('Missing actors')
        const signal = new AbortController().signal
        const failure = (cause: unknown): string => (cause as { kind: string }).kind
        const review = (
            actor: SessionUser,
            action: 'approve' | 'reject',
            id = 'demo-po-02',
            version = 1,
            key: string = crypto.randomUUID(),
            reason = 'Perbaiki jumlah',
        ) =>
            repository.mutate(
                actor,
                {
                    action,
                    id,
                    input: action === 'approve' ? { version } : { version, reason },
                    key,
                },
                metadata.generation,
                signal,
            )
        const denied = await Promise.all(
            [
                review(
                    { ...user, permissions: supervisor.permissions, roles: ['user', 'supervisor'] },
                    'approve',
                ),
                review({ ...admin, id: user.id }, 'reject'),
                review({ ...admin, permissions: [] }, 'approve'),
                review(maker, 'reject'),
                review(supervisor, 'approve', 'missing'),
                review(supervisor, 'approve', 'demo-po-01'),
                review(supervisor, 'approve', 'demo-po-02', 99),
                review(supervisor, 'reject', 'demo-po-02', 1, crypto.randomUUID(), '   '),
            ].map((promise) => promise.then(() => 'unexpected', failure)),
        )
        const submitted = await repository.mutate(
            admin,
            { action: 'submit', id: 'demo-po-26', input: { version: 1 }, key: 'admin-submit' },
            metadata.generation,
            signal,
        )
        const submitterDenied = await review(
            admin,
            'approve',
            submitted.id,
            submitted.version,
        ).then(() => 'unexpected', failure)
        const approved = await review(
            supervisor,
            'approve',
            submitted.id,
            submitted.version,
            'approve-once',
        )
        const retry = await review(
            supervisor,
            'approve',
            submitted.id,
            submitted.version,
            'approve-once',
        )
        const changedRetry = await review(
            supervisor,
            'approve',
            submitted.id,
            approved.version,
            'approve-once',
        ).then(() => 'unexpected', failure)
        const rejected = await review(supervisor, 'reject', 'demo-po-02', 1, 'reject-once')
        const reasonReload = (await repository.get(user, rejected.id, signal)).rejectionReason
        const edited = await repository.mutate(
            user,
            {
                action: 'update',
                id: rejected.id,
                input: {
                    ...purchaseOrderDraft(rejected),
                    version: rejected.version,
                    notes: 'Revised',
                },
                key: 'edit-rejected',
            },
            metadata.generation,
            signal,
        )
        const resubmitted = await repository.mutate(
            user,
            {
                action: 'submit',
                id: edited.id,
                input: { version: edited.version },
                key: 'resubmit',
            },
            metadata.generation,
            signal,
        )
        const secondReview = await review(admin, 'approve', resubmitted.id, resubmitted.version)
        const race = await Promise.all(
            [
                review(admin, 'approve', 'demo-po-07'),
                review(supervisor, 'reject', 'demo-po-07'),
            ].map((promise) => promise.then(() => 'success', failure)),
        )
        const legacy = await repository.get(admin, 'demo-po-01', signal)
        await runDemoTransaction(
            options,
            ['purchase-orders', 'purchaseOrderMutations'],
            'readwrite',
            async (transaction) => {
                const old = { ...legacy }
                Reflect.deleteProperty(old, 'rejectionReason')
                await transaction.put('purchase-orders', old)
                const receipts = await transaction.list('purchaseOrderMutations')
                for (const receipt of receipts) {
                    const result = { ...receipt.result }
                    Reflect.deleteProperty(result, 'rejectionReason')
                    await transaction.put('purchaseOrderMutations', { ...receipt, result })
                }
            },
        )
        const oldRecord = await repository.get(admin, legacy.id, signal)
        const oldReceipt = await review(
            supervisor,
            'approve',
            submitted.id,
            submitted.version,
            'approve-once',
        )
        const stored = await runDemoTransaction(
            options,
            ['audit', 'purchaseOrderMutations', 'metadata'],
            'readonly',
            async (transaction) => ({
                audits: await transaction.list('audit'),
                receipts: await transaction.count('purchaseOrderMutations'),
                metadata: await transaction.get('metadata', 'dataset'),
            }),
        )
        return {
            denied,
            submitterDenied,
            approved: [
                approved.status,
                approved.createdByUserId,
                approved.submittedByUserId,
                approved.version,
            ],
            retryVersion: retry.version,
            changedRetry,
            reasonReload,
            editReason: edited.rejectionReason,
            resubmitReason: resubmitted.rejectionReason,
            secondStatus: secondReview.status,
            race: race.sort(),
            oldReason: oldRecord.rejectionReason,
            oldReceiptReason: oldReceipt.rejectionReason,
            receipts: stored.receipts,
            audits: stored.audits.length,
            revisionDelta: (stored.metadata?.revision ?? 0) - metadata.revision,
            rejectionAudit: stored.audits.some(
                (audit) => 'reason' in audit && audit.reason === 'Perbaiki jumlah',
            ),
        }
    })
    expect(result).toEqual({
        denied: [
            'forbidden',
            'forbidden',
            'forbidden',
            'forbidden',
            'not-found',
            'conflict',
            'conflict',
            'validation',
        ],
        submitterDenied: 'forbidden',
        approved: ['approved', 'multiple-demo', 'admin-demo', 3],
        retryVersion: 3,
        changedRetry: 'conflict',
        reasonReload: 'Perbaiki jumlah',
        editReason: 'Perbaiki jumlah',
        resubmitReason: null,
        secondStatus: 'approved',
        race: ['conflict', 'success'],
        oldReason: null,
        oldReceiptReason: null,
        receipts: 7,
        audits: 7,
        revisionDelta: 7,
        rejectionAudit: true,
    })
})
