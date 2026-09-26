import { expect, test } from '@playwright/test'
import type * as SessionStoreModule from '../../../resources/js/src/stores/session'
import type * as SessionFixturesModule from '../../../resources/js/src/api/mocks/session-fixtures'
import type * as SessionControlsModule from '../../../resources/js/src/api/mocks/session-controls'
import { login } from './session-helpers'

test.skip(process.env.E2E_PRODUCTION === 'true', 'PO permission and actor changes')

test('clears an all-scope list and ignores delayed results after switching to an own-scope actor', async ({
    page,
}) => {
    await login(page, 'admin@woodflow.test', '/app/purchase-orders')
    await expect(page.getByText('26 PO', { exact: true })).toBeVisible()
    const panel = page.locator('details').filter({ hasText: 'Simulasi persisten' })
    await panel.locator('summary').click()
    await page.getByLabel('Operasi simulasi').selectOption('read')
    await page.getByLabel('Jeda simulasi').selectOption('1500')
    await page.getByLabel('Cari nomor PO atau Buyer', { exact: true }).fill('DEMO-PO-26')
    await page.getByRole('button', { name: 'Terapkan filter' }).click()
    await page.evaluate(async () => {
        const base = new URL(
            '/resources/js/src/',
            document.querySelector<HTMLScriptElement>('script[src*="/@vite/client"]')?.src ??
                location.origin,
        ).href
        const { useSessionStore } = (await import(
            base + 'stores/session.ts'
        )) as typeof SessionStoreModule
        const { sessionFixtures } = (await import(
            base + 'api/mocks/session-fixtures.ts'
        )) as typeof SessionFixturesModule
        const actor = sessionFixtures.find((candidate) => candidate.id === 'user-demo')
        if (!actor) throw new Error('Missing User fixture')
        useSessionStore().$patch({ user: actor, status: 'authenticated' })
    })
    await expect(page.getByText('Belum ada PO yang sesuai.', { exact: true })).toBeVisible()
    await expect(page.getByRole('cell', { name: 'DEMO-PO-26', exact: true })).toHaveCount(0)
    await expect(page.getByText('26 PO', { exact: true })).toHaveCount(0)
    await page.getByLabel('Cari nomor PO atau Buyer', { exact: true }).fill('')
    await page.getByRole('button', { name: 'Terapkan filter' }).click()
    await expect(page.getByText('25 PO', { exact: true })).toBeVisible()
})

test('revokes Admin PO menu, record and write access after session refresh', async ({ page }) => {
    await login(page, 'admin@woodflow.test', '/app/purchase-orders/demo-po-26')
    await expect(page.getByRole('link', { name: 'Edit PO', exact: true })).toBeVisible()
    const panel = page.locator('details').filter({ hasText: 'Simulasi persisten' })
    await panel.locator('summary').click()
    await page.getByLabel('Operasi simulasi').selectOption('update')
    await page.getByLabel('Skenario operasi').selectOption('csrf')
    await page.evaluate(async () => {
        const source = new URL(
            '/resources/js/src/api/mocks/session-controls.ts',
            document.querySelector<HTMLScriptElement>('script[src*="/@vite/client"]')?.src ??
                location.origin,
        ).href
        const { sessionScenario } = (await import(source)) as typeof SessionControlsModule
        sessionScenario.value = 'revoked'
    })
    await page.getByRole('button', { name: 'Submit PO', exact: true }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Konfirmasi', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Akses tidak diizinkan' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Purchase Order', exact: true })).toHaveCount(0)
    await expect(page.getByRole('heading', { name: 'DEMO-PO-26', exact: true })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Submit PO', exact: true })).toHaveCount(0)
})
