import { expect, test } from '@playwright/test'
import type { App } from 'vue'
import type * as SessionStoreModule from '../../../resources/js/src/stores/session'
import { login } from './session-helpers'

test.skip(process.env.E2E_PRODUCTION === 'true', 'Grader mock presentation and submit guards')
const path = '/app/master-data/graders'

test('hides write actions when only the read permission remains', async ({ page }) => {
    await login(page, 'admin@woodflow.test', path)
    await expect(page.getByRole('button', { name: 'Tambah Grader', exact: true })).toBeVisible()
    await page.evaluate(async () => {
        const moduleUrl = 'http://127.0.0.1:5174/resources/js/src/stores/session.ts'
        const { useSessionStore } = (await import(moduleUrl)) as typeof SessionStoreModule
        const mount = document.querySelector('#app') as Element & { __vue_app__: App }
        const store = mount.__vue_app__.runWithContext(() => useSessionStore())
        if (!store.user) throw new Error('Missing session')
        store.$patch({ user: { ...store.user, permissions: ['graders.read.all'] } })
    })
    await expect(page.getByRole('heading', { name: 'Master Grader', exact: true })).toBeVisible()
    await expect(page.getByRole('cell', { name: 'Grader Simulasi 24', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Tambah Grader', exact: true })).toHaveCount(0)
    await expect(page.getByRole('button', { name: /^Edit Grader/ })).toHaveCount(0)
    await expect(page.getByRole('button', { name: /^Ajukan aktivasi/ })).toHaveCount(0)
})

test('blocks duplicate submits while a write is pending', async ({ page }) => {
    await login(page, 'admin@woodflow.test', path)
    await page.getByText('Simulasi persisten', { exact: true }).click()
    await page.getByLabel('Operasi simulasi').selectOption('update')
    await page.getByLabel('Jeda simulasi').selectOption('1500')
    await page.getByRole('button', { name: 'Tambah Grader', exact: true }).click()
    await page.getByLabel('Nama Grader', { exact: true }).fill('Grader Submit Tunggal')
    await page.getByLabel('Email login', { exact: true }).fill('single@woodflow.test')
    await page
        .getByRole('dialog', { name: 'Tambah Grader', exact: true })
        .locator('form')
        .evaluate((form) => {
            if (!(form instanceof HTMLFormElement)) throw new Error('Missing form')
            form.requestSubmit()
            form.requestSubmit()
        })
    await expect(page.getByRole('button', { name: 'Simpan Grader', exact: true })).toBeDisabled()
    await expect(page.getByText('Grader berhasil disimpan.')).toBeVisible()
    await expect(page.getByText('25 Grader', { exact: true })).toBeVisible()
    await page.reload()
    await expect(
        page.getByRole('cell', { name: 'Grader Submit Tunggal', exact: true }),
    ).toHaveCount(1)
})
