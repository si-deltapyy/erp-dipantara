import { expect, test } from '@playwright/test'
import { login, expectNoOverflow } from './session-helpers'
import type * as OrderModule from '../../../resources/js/src/api/mocks/persistence/order-repository'
import type * as AssignmentModule from '../../../resources/js/src/api/mocks/persistence/assignment-repository'
import type * as DemoModule from '../../../resources/js/src/api/mocks/persistence/demo-repository'
import type * as SessionModule from '../../../resources/js/src/api/mocks/session-fixtures'
test.skip(process.env.E2E_PRODUCTION === 'true', 'Order review mock workflow')
test('reviews, rejects, repairs and approves an allocated order across actors', async ({
    page,
}, info) => {
    await login(page, 'maker@woodflow.test', '/app/orders/new')
    await page.getByLabel('Nomor PO', { exact: true }).selectOption('demo-po-03')
    await page.getByRole('button', { name: 'Simpan draft', exact: true }).click()
    await page.getByRole('button', { name: 'Tambah alokasi', exact: true }).click()
    await page.getByLabel('Mitra', { exact: true }).selectOption('demo-mitra-01')
    await page.getByLabel('Grader', { exact: true }).selectOption('demo-grader-01')
    await page.getByLabel('Kayu', { exact: true }).selectOption('demo-timber-01')
    await page.getByLabel('Jumlah alokasi', { exact: true }).fill('2')
    await page.getByRole('button', { name: 'Simpan alokasi', exact: true }).click()
    await page.getByRole('button', { name: 'Submit order', exact: true }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Konfirmasi', exact: true }).click()
    await expect(page.getByText('Diajukan', { exact: true })).toBeVisible()
    const url = page.url()
    await page.getByRole('button', { name: 'Keluar', exact: true }).click()
    await login(page, 'supervisor@woodflow.test', url)
    await page.getByRole('button', { name: 'Tolak order', exact: true }).click()
    await page.getByLabel('Alasan penolakan', { exact: true }).fill('Lengkapi catatan alokasi')
    await page.getByRole('dialog').getByRole('button', { name: 'Konfirmasi', exact: true }).click()
    await page.reload()
    await expect(page.getByText('Ditolak', { exact: true })).toBeVisible()
    await expect(
        page.getByText('Alasan penolakan terakhir: Lengkapi catatan alokasi'),
    ).toBeVisible()
    await page.getByRole('button', { name: 'Keluar', exact: true }).click()
    await login(page, 'maker@woodflow.test', url)
    await page.getByRole('link', { name: 'Edit order', exact: true }).click()
    await page.getByLabel('Catatan', { exact: true }).fill('Alokasi sudah diperiksa')
    await page.getByRole('button', { name: 'Simpan draft', exact: true }).click()
    await page.getByRole('button', { name: 'Submit order', exact: true }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Konfirmasi', exact: true }).click()
    await expect(page.getByText('Diajukan', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Keluar', exact: true }).click()
    await login(page, 'supervisor@woodflow.test', url)
    await page.getByRole('button', { name: 'Setujui order', exact: true }).focus()
    await page.keyboard.press('Enter')
    await expect(
        page.getByRole('dialog').getByRole('button', { name: 'Batal', exact: true }),
    ).toBeFocused()
    await page.keyboard.press('Escape')
    await page.getByRole('button', { name: 'Setujui order', exact: true }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Konfirmasi', exact: true }).click()
    await expect(page.getByText('Disetujui', { exact: true })).toBeVisible()
    await expectNoOverflow(page)
    await page.screenshot({ path: info.outputPath('order-review.png'), fullPage: true })
})
test('checks complete allocation, stale aggregate versions, no self review and immutable submitted assignments', async ({
    page,
}) => {
    await page.goto('/app')
    const result = await page.evaluate(async () => {
        const base = new URL(
            '/resources/js/src/',
            document.querySelector<HTMLScriptElement>('script[src*="/@vite/client"]')?.src ??
                location.origin,
        ).href
        const { OrderRepository } = (await import(
            base + 'api/mocks/persistence/order-repository.ts'
        )) as typeof OrderModule
        const { AssignmentRepository } = (await import(
            base + 'api/mocks/persistence/assignment-repository.ts'
        )) as typeof AssignmentModule
        const { DemoRepository } = (await import(
            base + 'api/mocks/persistence/demo-repository.ts'
        )) as typeof DemoModule
        const { sessionFixtures } = (await import(
            base + 'api/mocks/session-fixtures.ts'
        )) as typeof SessionModule
        const options = { name: 'order-review-' + crypto.randomUUID() }
        const metadata = await new DemoRepository(options).initialize()
        const repository = new OrderRepository(options),
            assignments = new AssignmentRepository(options)
        const admin = sessionFixtures.find((actor) => actor.id === 'admin-demo')
        const reviewer = sessionFixtures.find((actor) => actor.id === 'supervisor-demo')
        if (!admin || !reviewer) throw new Error('Missing actors')
        const signal = new AbortController().signal
        const input = { purchaseOrderId: 'demo-po-03', notes: null }
        const created = await repository.mutate(
            admin,
            { action: 'create', input, key: 'create' },
            metadata.generation,
            signal,
        )
        const failures: string[] = []
        async function capture(action: () => Promise<unknown>): Promise<void> {
            try {
                await action()
                failures.push('unexpected-success')
            } catch (cause) {
                failures.push((cause as { kind: string }).kind)
            }
        }
        await capture(() =>
            repository.mutate(
                admin,
                {
                    action: 'submit',
                    id: created.id,
                    input: { version: created.version },
                    key: 'empty',
                },
                metadata.generation,
                signal,
            ),
        )
        const allocation = {
            orderId: created.id,
            mitraId: 'demo-mitra-01',
            graderId: 'demo-grader-01',
            timberProductId: 'demo-timber-01',
            quantity: 2,
        }
        const assignment = await assignments.mutate(
            admin,
            { action: 'create', input: allocation, key: 'allocate' },
            metadata.generation,
            signal,
        )
        await capture(() =>
            repository.mutate(
                admin,
                {
                    action: 'submit',
                    id: created.id,
                    input: { version: created.version },
                    key: 'stale',
                },
                metadata.generation,
                signal,
            ),
        )
        const ready = await repository.get(admin, created.id, signal)
        const submitted = await repository.mutate(
            admin,
            { action: 'submit', id: created.id, input: { version: ready.version }, key: 'submit' },
            metadata.generation,
            signal,
        )
        await capture(() =>
            repository.mutate(
                admin,
                {
                    action: 'approve',
                    id: created.id,
                    input: { version: submitted.version },
                    key: 'self',
                },
                metadata.generation,
                signal,
            ),
        )
        await capture(() =>
            assignments.mutate(
                admin,
                {
                    action: 'update',
                    id: assignment.id,
                    input: { ...allocation, version: assignment.version },
                    key: 'locked',
                },
                metadata.generation,
                signal,
            ),
        )
        const rejected = await repository.mutate(
            reviewer,
            {
                action: 'reject',
                id: created.id,
                input: { version: submitted.version, reason: 'Correct the notes' },
                key: 'reject',
            },
            metadata.generation,
            signal,
        )
        const edited = await repository.mutate(
            admin,
            {
                action: 'update',
                id: created.id,
                input: { ...input, notes: 'Corrected', version: rejected.version },
                key: 'edit',
            },
            metadata.generation,
            signal,
        )
        const resubmitted = await repository.mutate(
            admin,
            {
                action: 'submit',
                id: created.id,
                input: { version: edited.version },
                key: 'resubmit',
            },
            metadata.generation,
            signal,
        )
        const approved = await repository.mutate(
            reviewer,
            {
                action: 'approve',
                id: created.id,
                input: { version: resubmitted.version },
                key: 'approve',
            },
            metadata.generation,
            signal,
        )
        const retry = await repository.mutate(
            reviewer,
            {
                action: 'approve',
                id: created.id,
                input: { version: resubmitted.version },
                key: 'approve',
            },
            metadata.generation,
            signal,
        )
        return {
            failures,
            rejected: rejected.rejectionReason,
            edited: edited.rejectionReason,
            cleared: resubmitted.rejectionReason,
            status: approved.status,
            retryVersion: retry.version,
            version: approved.version,
        }
    })
    expect(result.failures).toEqual(['validation', 'conflict', 'forbidden', 'conflict'])
    expect(result.rejected).toBe('Correct the notes')
    expect(result.edited).toBe('Correct the notes')
    expect(result.cleared).toBeNull()
    expect(result.status).toBe('approved')
    expect(result.retryVersion).toBe(result.version)
})
