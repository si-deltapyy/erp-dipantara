import { expect, test } from '@playwright/test'
import type * as DocumentModule from '../../../resources/js/src/api/mocks/persistence/document-repository'
import type * as DemoModule from '../../../resources/js/src/api/mocks/persistence/demo-repository'
import type * as SessionModule from '../../../resources/js/src/api/mocks/session-fixtures'
import type * as TransactionModule from '../../../resources/js/src/api/mocks/persistence/transaction'
import type * as BindingModule from '../../../resources/js/src/api/mocks/persistence/document-binding'
import type { DocumentUpload } from '../../../resources/js/src/core/types/document'
import type { SessionUser } from '../../../resources/js/src/core/types/session'
import type * as SchemaModule from '../../../resources/js/src/api/mocks/persistence/schema'
import type * as FixtureModule from '../../../resources/js/src/api/mocks/purchase-order-fixtures'

test.skip(process.env.E2E_PRODUCTION === 'true', 'Native document persistence and scope')
test('upgrades schema seven without replacing existing PO records', async ({ page }) => {
    await page.goto('/app')
    const result = await page.evaluate(async () => {
        const base = new URL(
            '/resources/js/src/',
            document.querySelector<HTMLScriptElement>('script[src*="/@vite/client"]')?.src ??
                location.origin,
        ).href
        const { demoStores } = (await import(
            base + 'api/mocks/persistence/schema.ts'
        )) as typeof SchemaModule
        const { purchaseOrderFixtures } = (await import(
            base + 'api/mocks/purchase-order-fixtures.ts'
        )) as typeof FixtureModule
        const { runDemoTransaction } = (await import(
            base + 'api/mocks/persistence/transaction.ts'
        )) as typeof TransactionModule
        const name = 'document-upgrade-' + crypto.randomUUID()
        const original = purchaseOrderFixtures[0]
        if (!original) throw new Error('Missing fixture')
        await new Promise<void>((resolve, reject) => {
            const request = indexedDB.open(name, 7)
            request.onupgradeneeded = () => {
                for (const store of demoStores.filter(
                    (store) => store !== 'documents' && store !== 'documentMutations',
                ))
                    request.result.createObjectStore(store, { keyPath: 'id' })
                request.transaction
                    ?.objectStore('purchase-orders')
                    .put({ ...original, number: 'SYNTHETIC-PRESERVED', version: 12 })
            }
            request.onerror = () => reject(request.error)
            request.onsuccess = () => {
                request.result.close()
                resolve()
            }
        })
        return runDemoTransaction(
            { name },
            ['documents', 'documentMutations', 'purchase-orders'],
            'readonly',
            async (tx) => ({
                order: await tx.get('purchase-orders', original.id),
                documents: await tx.count('documents'),
                receipts: await tx.count('documentMutations'),
            }),
        )
    })
    expect(result.order?.number).toBe('SYNTHETIC-PRESERVED')
    expect(result.order?.version).toBe(12)
    expect(result.documents).toBe(0)
    expect(result.receipts).toBe(0)
})
test('enforces scopes, atomic upload retry, private staged expiry and transactional binding', async ({
    page,
}) => {
    await page.goto('/app')
    const result = await page.evaluate(async () => {
        const base = new URL(
            '/resources/js/src/',
            document.querySelector<HTMLScriptElement>('script[src*="/@vite/client"]')?.src ??
                location.origin,
        ).href
        const { DocumentRepository } = (await import(
            base + 'api/mocks/persistence/document-repository.ts'
        )) as typeof DocumentModule
        const { DemoRepository } = (await import(
            base + 'api/mocks/persistence/demo-repository.ts'
        )) as typeof DemoModule
        const { sessionFixtures } = (await import(
            base + 'api/mocks/session-fixtures.ts'
        )) as typeof SessionModule
        const { runDemoTransaction } = (await import(
            base + 'api/mocks/persistence/transaction.ts'
        )) as typeof TransactionModule
        const { bindStagedDocuments } = (await import(
            base + 'api/mocks/persistence/document-binding.ts'
        )) as typeof BindingModule
        const options = { name: 'documents-' + crypto.randomUUID() }
        const demo = new DemoRepository(options)
        const metadata = await demo.initialize()
        const repository = new DocumentRepository(options)
        const user = sessionFixtures.find((actor) => actor.id === 'user-demo')
        const admin = sessionFixtures.find((actor) => actor.id === 'admin-demo')
        if (!user || !admin) throw new Error('Missing actors')
        const signal = new AbortController().signal
        const parent = { parentType: 'purchase-order' as const, parentId: 'demo-po-03' }
        const input: DocumentUpload = {
            ...parent,
            purpose: 'approved_po',
            file: new File(['%PDF-1.7'], 'synthetic.pdf', { type: 'application/pdf' }),
        }
        const failure = (cause: unknown): string => (cause as { kind: string }).kind
        const upload = (
            actor: SessionUser,
            patch: Partial<DocumentUpload> = {},
            key: string = crypto.randomUUID(),
        ) => repository.upload(actor, { ...input, ...patch }, key, metadata.generation, signal)
        const before = await runDemoTransaction(options, ['purchase-orders'], 'readonly', (tx) =>
            tx.get('purchase-orders', parent.parentId),
        )
        const [first, retry] = await Promise.all([
            upload(user, {}, 'same-key'),
            upload(user, {}, 'same-key'),
        ])
        const bytes = await (await repository.download(user, first.id, signal)).blob.text()
        const denied = await Promise.all([
            upload({ ...admin, permissions: [] }).catch(failure),
            upload({ ...user, id: 'other-user' }).catch(failure),
            upload(
                user,
                { file: new File(['%PDF-2.0'], 'synthetic.pdf', { type: 'application/pdf' }) },
                'same-key',
            ).catch(failure),
            repository
                .download({ ...admin, permissions: ['documents.read.all'] }, first.id, signal)
                .catch(failure),
        ])
        const staged = await upload(user, { parentId: null })
        const stagedDenied = await repository.download(admin, staged.id, signal).catch(failure)
        const foreignBinding = await runDemoTransaction(
            options,
            ['documents', 'purchase-orders'],
            'readwrite',
            (tx) => bindStagedDocuments(tx, admin, parent, 'approved_po', [staged.id]),
        ).catch(failure)
        const stagedBytes = await (await repository.download(user, staged.id, signal)).blob.text()
        let rolledBack = false
        try {
            await runDemoTransaction(
                options,
                ['documents', 'purchase-orders'],
                'readwrite',
                async (tx) => {
                    await bindStagedDocuments(tx, user, parent, 'approved_po', [staged.id])
                    throw new Error('Synthetic parent failure')
                },
            )
        } catch {
            rolledBack = true
        }
        const privateAfterRollback = await repository
            .download(admin, staged.id, signal)
            .catch(failure)
        await runDemoTransaction(options, ['documents', 'purchase-orders'], 'readwrite', (tx) =>
            bindStagedDocuments(tx, user, parent, 'approved_po', [staged.id]),
        )
        const bound = await repository.download(admin, staged.id, signal)
        const expired = await upload(user, { parentId: null })
        await runDemoTransaction(options, ['documents'], 'readwrite', async (tx) => {
            const document = await tx.get('documents', expired.id)
            if (document) await tx.put('documents', { ...document, expiresAt: Date.now() - 1 })
        })
        const expiredDenied = await repository.download(user, expired.id, signal).catch(failure)
        const expiredBinding = await runDemoTransaction(
            options,
            ['documents', 'purchase-orders'],
            'readwrite',
            (tx) => bindStagedDocuments(tx, user, parent, 'approved_po', [expired.id]),
        ).catch(failure)
        const snapshot = () =>
            runDemoTransaction(
                options,
                ['documents', 'documentMutations', 'metadata', 'audit'],
                'readonly',
                async (tx) => ({
                    count: await tx.count('documents'),
                    receipts: await tx.count('documentMutations'),
                    audit: await tx.count('audit'),
                    metadata: await tx.get('metadata', 'dataset'),
                }),
            )
        const beforeFailure = await snapshot()
        const originalPut = IDBObjectStore.prototype.put
        let quotaFailure: unknown
        try {
            IDBObjectStore.prototype.put = function (
                value: unknown,
                key?: IDBValidKey,
            ): IDBRequest<IDBValidKey> {
                if (this.name === 'audit')
                    throw new DOMException('Synthetic quota failure', 'QuotaExceededError')
                return key === undefined
                    ? originalPut.call(this, value)
                    : originalPut.call(this, value, key)
            }
            quotaFailure = await upload(user).catch(failure)
        } finally {
            IDBObjectStore.prototype.put = originalPut
        }
        const atomicRollback = JSON.stringify(beforeFailure) === JSON.stringify(await snapshot())
        const listed = await repository.list(user, parent, signal)
        const after = await runDemoTransaction(options, ['purchase-orders'], 'readonly', (tx) =>
            tx.get('purchase-orders', parent.parentId),
        )
        await demo.reset(signal)
        const resetDenied = await repository.download(user, first.id, signal).catch(failure)
        const staleGeneration = await upload(user).catch(failure)
        return {
            sameId: first.id === retry.id,
            bytes,
            denied,
            stagedDenied,
            stagedBytes,
            rolledBack,
            privateAfterRollback,
            boundSize: bound.blob.size,
            expiredDenied,
            count: listed.length,
            unchanged: JSON.stringify(before) === JSON.stringify(after),
            resetDenied,
            staleGeneration,
            foreignBinding,
            expiredBinding,
            quotaFailure,
            atomicRollback,
        }
    })
    expect(result).toEqual({
        sameId: true,
        bytes: '%PDF-1.7',
        denied: ['forbidden', 'not-found', 'conflict', 'forbidden'],
        stagedDenied: 'not-found',
        stagedBytes: '%PDF-1.7',
        rolledBack: true,
        privateAfterRollback: 'not-found',
        boundSize: 8,
        expiredDenied: 'not-found',
        count: 2,
        unchanged: true,
        resetDenied: 'not-found',
        staleGeneration: 'conflict',
        foreignBinding: 'not-found',
        expiredBinding: 'conflict',
        quotaFailure: 'quota',
        atomicRollback: true,
    })
})
