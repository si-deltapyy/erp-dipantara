import { expect, test } from '@playwright/test'
import type * as ScenarioModule from '../grading-scenario'
import type * as RepositoryModule from '../../../resources/js/src/api/mocks/persistence/delivery-repository'
import type * as TransactionModule from '../../../resources/js/src/api/mocks/persistence/transaction'
import { login, expectNoOverflow } from './session-helpers'

test.skip(process.env.E2E_PRODUCTION === 'true', 'Delivery allocation mock')

test('splits 500 units atomically, rejects stale stock and protects reserved grading rows', async ({
    page,
}) => {
    await page.goto('/app')
    const result = await page.evaluate(async () => {
        const origin = new URL(
            document.querySelector<HTMLScriptElement>('script[src*="/@vite/client"]')?.src ??
                location.origin,
        ).origin
        const { createApprovedGradingScenario } = (await import(
            origin + '/tests/frontend/grading-scenario.ts'
        )) as typeof ScenarioModule
        const { DeliveryRepository } = (await import(
            origin + '/resources/js/src/api/mocks/persistence/delivery-repository.ts'
        )) as typeof RepositoryModule
        const { runDemoTransaction } = (await import(
            origin + '/resources/js/src/api/mocks/persistence/transaction.ts'
        )) as typeof TransactionModule
        const scenario = await createApprovedGradingScenario()
        const { options, signal, generation, maker, grader, gradings, approved } = scenario
        await runDemoTransaction(options, ['gradings'], 'readwrite', async (transaction) => {
            await transaction.put('gradings', {
                ...approved,
                rows: approved.rows.map((row) => ({ ...row, quantity: 500 })),
            })
        })
        const repository = new DeliveryRepository(options)
        const query = {
            page: 1,
            perPage: 20,
            search: '',
            sort: 'createdAt' as const,
            purchaseOrderId: 'demo-po-03',
        }
        const stock = () => repository.availability(maker, query, signal)
        const input = async (quantity: number) => ({
            purchaseOrderId: 'demo-po-03',
            deliveryDate: '2026-09-28',
            licensePlate: 'DEMO 01',
            allocations: [{ gradingId: approved.id, rowId: 'stable-row', quantity }],
            documents: [],
            availabilityToken: (await stock()).data[0]?.snapshotToken ?? '',
        })
        const failures: string[] = []
        const fail = async (run: () => Promise<unknown>) => {
            try {
                await run()
                failures.push('unexpected-success')
            } catch (cause) {
                failures.push((cause as { kind: string }).kind)
            }
        }
        const firstInput = await input(200)
        const first = await repository.mutate(
            maker,
            { action: 'create', input: firstInput, key: 'first' },
            generation,
            signal,
        )
        const replay = await repository.mutate(
            maker,
            { action: 'create', input: firstInput, key: 'first' },
            generation,
            signal,
        )
        await fail(() =>
            repository.mutate(
                maker,
                { action: 'create', input: firstInput, key: 'stale' },
                generation,
                signal,
            ),
        )
        const racingInput = await input(200)
        const race = await Promise.allSettled(
            ['race-a', 'race-b'].map((key) =>
                repository.mutate(
                    maker,
                    { action: 'create', input: racingInput, key },
                    generation,
                    signal,
                ),
            ),
        )
        const overInput = await input(101)
        await fail(() =>
            repository.mutate(
                maker,
                { action: 'create', input: overInput, key: 'over' },
                generation,
                signal,
            ),
        )
        await repository.mutate(
            maker,
            { action: 'create', input: await input(100), key: 'last' },
            generation,
            signal,
        )
        await fail(() => repository.list(grader, query, signal))
        await fail(() =>
            gradings.mutate(
                grader,
                {
                    action: 'revise',
                    id: approved.id,
                    input: {
                        version: approved.version,
                        reason: 'Attempt changing reserved row',
                        gradingDate: approved.gradingDate,
                        rows: approved.rows.map((row) => ({
                            ...row,
                            diameterCm: '20.00',
                            quantity: 500,
                        })),
                    },
                    key: 'reserved-revision',
                },
                generation,
                signal,
            ),
        )
        const allocations = await repository.list(maker, query, signal)
        const editing = await repository.availability(
            maker,
            { ...query, excludeDeliveryId: first.id },
            signal,
        )
        const updated = await repository.mutate(
            maker,
            {
                action: 'update',
                id: first.id,
                input: {
                    ...firstInput,
                    availabilityToken: editing.data[0]?.snapshotToken ?? '',
                    version: first.version,
                    allocations: firstInput.allocations.map((row) => ({ ...row, quantity: 150 })),
                },
                key: 'reduce',
            },
            generation,
            signal,
        )
        return {
            failures,
            race: race.map((result) => result.status).sort(),
            quantities: allocations.data
                .flatMap((delivery) => delivery.allocations.map((row) => row.quantity))
                .sort((a, b) => a - b),
            replay: replay.id === first.id,
            availableAfterEdit: (await stock()).data[0]?.availableQuantity,
            updatedVersion: updated.version,
        }
    })
    expect(result.failures).toEqual(['conflict', 'conflict', 'forbidden', 'conflict'])
    expect(result.race).toEqual(['fulfilled', 'rejected'])
    expect(result.quantities).toEqual([100, 200, 200])
    expect(result.replay).toBe(true)
    expect(result.availableAfterEdit).toBe(50)
    expect(result.updatedVersion).toBe(2)
})

test('creates and edits delivery through the UI and preserves stock after reload', async ({
    page,
}, info) => {
    await page.goto('/app')
    await page.evaluate(async () => {
        const origin = new URL(
            document.querySelector<HTMLScriptElement>('script[src*="/@vite/client"]')?.src ??
                location.origin,
        ).origin
        const { createApprovedGradingScenario } = (await import(
            origin + '/tests/frontend/grading-scenario.ts'
        )) as typeof ScenarioModule
        await createApprovedGradingScenario('woodflow-demo')
    })
    await login(page, 'maker@woodflow.test', '/app/deliveries/new')
    await page.getByLabel('Nomor PO', { exact: true }).selectOption('demo-po-03')
    await page.getByLabel('Nomor polisi', { exact: true }).fill('DEMO 2026')
    await page.getByLabel(/Jumlah dialokasikan —/).fill('1')
    await page.getByRole('button', { name: 'Simpan draft', exact: true }).click()
    await expect(
        page.getByRole('heading', { name: 'Detail pengiriman', exact: true }),
    ).toBeVisible()
    await page.reload()
    await expect(page.getByText('DEMO 2026', { exact: true })).toBeVisible()
    await page.getByRole('link', { name: 'Edit pengiriman', exact: true }).click()
    await expect(page.getByLabel(/Jumlah dialokasikan —/)).toHaveValue('1')
    await page.getByLabel(/Jumlah dialokasikan —/).fill('2')
    await page.getByRole('button', { name: 'Simpan draft', exact: true }).click()
    await expect(
        page.getByRole('heading', { name: 'Detail pengiriman', exact: true }),
    ).toBeVisible()
    await expectNoOverflow(page)
    await page.screenshot({ path: info.outputPath('delivery-allocation.png'), fullPage: true })
    await page.getByRole('link', { name: 'Kembali ke daftar', exact: true }).click()
    await expect(page.getByRole('cell', { name: 'DEMO 2026', exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Keluar', exact: true }).click()
    await login(page, 'grader1@woodflow.test', '/app/deliveries/new')
    await expect(page.getByRole('heading', { name: 'Tambah pengiriman', exact: true })).toHaveCount(
        0,
    )
})
