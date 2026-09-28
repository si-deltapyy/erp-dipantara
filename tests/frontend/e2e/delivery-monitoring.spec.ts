import { expect, test } from '@playwright/test'
import type * as ScenarioModule from '../delivery-scenario'
import type * as TransactionModule from '../../../resources/js/src/api/mocks/persistence/transaction'
import { login, expectNoOverflow } from './session-helpers'

test.skip(process.env.E2E_PRODUCTION === 'true', 'Scoped delivery mock')

test('scopes mixed shipments before pagination and redacts other assignments and documents', async ({
    page,
}) => {
    await page.goto('/app')
    const result = await page.evaluate(async () => {
        const origin = new URL(
            document.querySelector<HTMLScriptElement>('script[src*="/@vite/client"]')?.src ??
                location.origin,
        ).origin
        const { createDeliveryScenario } = (await import(
            origin + '/tests/frontend/delivery-scenario.ts'
        )) as typeof ScenarioModule
        const { runDemoTransaction } = (await import(
            origin + '/resources/js/src/api/mocks/persistence/transaction.ts'
        )) as typeof TransactionModule
        const scenario = await createDeliveryScenario('woodflow-demo')
        const { options, maker, grader, signal, deliveries, assignment, query } = scenario
        const ready = await scenario.attachDocuments()
        await runDemoTransaction(
            options,
            ['deliveries', 'assignments'],
            'readwrite',
            async (transaction) => {
                await transaction.put('assignments', {
                    ...assignment,
                    id: 'other-assignment',
                    graderUserId: 'grader-two',
                })
                await transaction.put('deliveries', {
                    ...ready,
                    allocations: [
                        ...ready.allocations,
                        { gradingId: 'other-grading', rowId: 'other-row', quantity: 7 },
                    ],
                    allocationContext: [
                        ...ready.allocationContext,
                        {
                            gradingId: 'other-grading',
                            rowId: 'other-row',
                            quantity: 7,
                            assignmentId: 'other-assignment',
                            mitraName: 'Restricted mitra',
                            timberProductName: 'Restricted timber',
                        },
                    ],
                })
            },
        )
        const scoped = await deliveries.get(grader, ready.id, signal)
        const global = await deliveries.get(maker, ready.id, signal)
        const owner = { ...grader, id: 'user-demo', permissions: ['deliveries.read.own'] }
        const outsider = { ...owner, id: 'another-owner' }
        const failures: string[] = []
        for (const action of [
            () => deliveries.get(outsider, ready.id, signal),
            () => deliveries.get({ ...grader, id: 'unassigned-grader' }, ready.id, signal),
            () =>
                scenario.documents.list(
                    grader,
                    { parentType: 'delivery', parentId: ready.id },
                    signal,
                ),
            () => deliveries.availability(grader, query, signal),
        ]) {
            try {
                await action()
                failures.push('unexpected-success')
            } catch (cause) {
                failures.push((cause as { kind: string }).kind)
            }
        }
        return {
            id: ready.id,
            assignmentId: assignment.id,
            scopedQuantity: scoped.allocations.reduce((sum, row) => sum + row.quantity, 0),
            scopedDocuments: scoped.documents.length,
            scopedActions: scoped.allowedActions,
            fullQuantity: global.allocations.reduce((sum, row) => sum + row.quantity, 0),
            ownerTotal: (await deliveries.list(owner, query, signal)).meta.total,
            outsiderTotal: (await deliveries.list(outsider, query, signal)).meta.total,
            hiddenAssignmentTotal: (
                await deliveries.list(
                    grader,
                    { ...query, assignmentId: 'other-assignment' },
                    signal,
                )
            ).meta.total,
            failures,
        }
    })
    expect(result.scopedQuantity).toBe(2)
    expect(result.fullQuantity).toBe(9)
    expect(result.scopedDocuments).toBe(0)
    expect(result.scopedActions).toEqual([])
    expect(result.ownerTotal).toBe(1)
    expect(result.outsiderTotal).toBe(0)
    expect(result.hiddenAssignmentTotal).toBe(0)
    expect(result.failures).toEqual(['not-found', 'not-found', 'not-found', 'forbidden'])
    await login(page, 'grader1@woodflow.test', '/app/assignments/' + result.assignmentId)
    await page.getByRole('link', { name: 'Pantau pengiriman', exact: true }).click()
    await expect(page).toHaveURL(new RegExp('assignmentId=' + result.assignmentId))
    await page.getByLabel('Status', { exact: true }).selectOption('received')
    await expect(page.getByText('Belum ada pengiriman yang sesuai.', { exact: true })).toBeVisible()
    await page.getByLabel('Status', { exact: true }).selectOption('draft')
    await page.getByLabel('Cari PO, Buyer atau nomor polisi', { exact: true }).fill('DEMO')
    await page.getByRole('button', { name: 'Cari', exact: true }).click()
    await expect(page).toHaveURL(new RegExp('assignmentId=' + result.assignmentId))
    await page.reload()
    await expect(page.getByLabel('Status', { exact: true })).toHaveValue('draft')
    await page.getByRole('link', { name: /Buka pengiriman/ }).click()
    await expect(page.getByText('Restricted mitra', { exact: true })).toHaveCount(0)
    await expect(page.getByRole('heading', { name: 'Dokumen SAKR', exact: true })).toHaveCount(0)
    await expect(page.getByRole('link', { name: 'Edit pengiriman', exact: true })).toHaveCount(0)
    await expectNoOverflow(page)
    await page.getByRole('button', { name: 'Keluar', exact: true }).click()
    await login(page, 'user@woodflow.test', '/app/purchase-orders/demo-po-03')
    await page.getByRole('link', { name: 'Pantau pengiriman', exact: true }).click()
    await expect(page).toHaveURL(/purchaseOrderId=demo-po-03/)
    await page.getByRole('link', { name: /Buka pengiriman/ }).click()
    await expect(page.getByText('Restricted mitra', { exact: true })).toBeVisible()
})
