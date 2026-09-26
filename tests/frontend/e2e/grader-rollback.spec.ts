import { expect, test } from '@playwright/test'
import type * as DemoModule from '../../../resources/js/src/api/mocks/persistence/demo-repository'
import type * as TransactionModule from '../../../resources/js/src/api/mocks/persistence/transaction'
import type * as MutationModule from '../../../resources/js/src/api/mocks/persistence/grader-mutation'
import type * as ProvisionModule from '../../../resources/js/src/api/mocks/persistence/grader-provision'
import type * as SessionModule from '../../../resources/js/src/api/mocks/session-fixtures'

test.skip(process.env.E2E_PRODUCTION === 'true', 'Grader transaction fault injection')

test('rolls back profile and provisioning writes together with audit and receipts', async ({
    page,
}) => {
    await page.goto('/app')
    const result = await page.evaluate(async () => {
        const base = new URL(
            '/resources/js/src/api/mocks/',
            document.querySelector<HTMLScriptElement>('script[src*="/@vite/client"]')?.src ??
                location.origin,
        ).href
        const { DemoRepository } = (await import(
            base + 'persistence/demo-repository.ts'
        )) as typeof DemoModule
        const { runDemoTransaction } = (await import(
            base + 'persistence/transaction.ts'
        )) as typeof TransactionModule
        const { writeGrader } = (await import(
            base + 'persistence/grader-mutation.ts'
        )) as typeof MutationModule
        const { provisionGrader } = (await import(
            base + 'persistence/grader-provision.ts'
        )) as typeof ProvisionModule
        const { sessionFixtures } = (await import(
            base + 'session-fixtures.ts'
        )) as typeof SessionModule
        const actor = sessionFixtures.find((user) => user.id === 'admin-demo')
        if (!actor) throw new Error('Missing actor')
        const options = { name: 'grader-rollback-' + crypto.randomUUID() }
        const metadata = await new DemoRepository(options).initialize()
        const stores = ['graders', 'metadata', 'audit', 'graderMutations'] as const
        const failures: boolean[] = []
        for (const action of ['profile', 'provision']) {
            const failed = await runDemoTransaction(
                options,
                stores,
                'readwrite',
                async (transaction) => {
                    if (action === 'profile')
                        await writeGrader(transaction, metadata, actor, {
                            input: {
                                name: 'Rollback Grader',
                                email: 'rollback@woodflow.test',
                                phone: '',
                                address: '',
                            },
                            idempotencyKey: 'rollback-profile',
                            payloadHash: 'synthetic-profile-hash',
                        })
                    else
                        await provisionGrader(
                            transaction,
                            metadata,
                            actor,
                            'demo-grader-24',
                            { version: 1 },
                            'rollback-provision',
                            'synthetic-provision-hash',
                        )
                    throw new DOMException('Simulated quota failure', 'QuotaExceededError')
                },
            ).then(
                () => false,
                () => true,
            )
            failures.push(failed)
        }
        const after = await runDemoTransaction(
            options,
            stores,
            'readonly',
            async (transaction) => ({
                count: await transaction.count('graders'),
                audits: await transaction.count('audit'),
                receipts: await transaction.count('graderMutations'),
                revision: (await transaction.get('metadata', 'dataset'))?.revision,
                status: (await transaction.get('graders', 'demo-grader-24'))?.provisioningStatus,
                version: (await transaction.get('graders', 'demo-grader-24'))?.version,
            }),
        )
        return { failures, ...after, originalRevision: metadata.revision }
    })
    expect(result.failures).toEqual([true, true])
    expect(result.count).toBe(24)
    expect(result.audits).toBe(0)
    expect(result.receipts).toBe(0)
    expect(result.revision).toBe(result.originalRevision)
    expect(result.status).toBe('not_provisioned')
    expect(result.version).toBe(1)
})
