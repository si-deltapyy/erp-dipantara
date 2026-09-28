import { expect } from '@playwright/test'
import type { Page, TestInfo } from '@playwright/test'
import type * as ScenarioModule from '../uat-scenario'
import { login, expectNoOverflow } from './session-helpers'
export const actors = {
    admin: 'admin@woodflow.test',
    user: 'user@woodflow.test',
    maker: 'maker@woodflow.test',
    supervisor: 'supervisor@woodflow.test',
    graderOne: 'grader1@woodflow.test',
    graderTwo: 'grader2@woodflow.test',
    multiple: 'multiple@woodflow.test',
} as const
export async function switchActor(page: Page, email: string, path: string): Promise<void> {
    await page.getByRole('button', { name: 'Keluar', exact: true }).click()
    await login(page, email, path)
}
export async function confirmDialog(page: Page): Promise<void> {
    await page.getByRole('dialog').getByRole('button', { name: 'Konfirmasi', exact: true }).click()
}
export async function act(page: Page, button: string, status: string): Promise<void> {
    await page.getByRole('button', { name: button, exact: true }).click()
    await confirmDialog(page)
    await expect(page.getByText(status, { exact: true })).toBeVisible()
}
export async function reject(page: Page, button: string, reason: string): Promise<void> {
    await page.getByRole('button', { name: button, exact: true }).click()
    await page.getByLabel('Alasan penolakan', { exact: true }).fill(reason)
    await confirmDialog(page)
    await expect(page.getByText('Ditolak', { exact: true })).toBeVisible()
}
export async function simulateUpdate(page: Page, scenario: string): Promise<void> {
    const panel = page.locator('details').filter({ hasText: 'Simulasi persisten' })
    if (!(await panel.evaluate((element) => element.hasAttribute('open'))))
        await panel.locator('summary').click()
    await page.getByLabel('Operasi simulasi').selectOption('update')
    await page.getByLabel('Skenario operasi').selectOption(scenario)
}
export async function expectPersisted(page: Page, text: string): Promise<void> {
    await page.reload()
    await expect(page.getByText(text, { exact: true }).first()).toBeVisible()
}
export async function captureEvidence(page: Page, info: TestInfo, name: string): Promise<void> {
    await expectNoOverflow(page)
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.screenshot({
        path: `../docs/evidence/sprint-13a/${name}-${info.project.name}.png`,
        fullPage: true,
    })
}
export function collectPageErrors(page: Page): string[] {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    return errors
}
export function recordId(page: Page): string {
    return new URL(page.url()).pathname.split('/').at(-1) ?? ''
}
export async function uploadPdf(page: Page, label: string, name: string): Promise<void> {
    await page.getByLabel(label, { exact: true }).setInputFiles({
        name,
        mimeType: 'application/pdf',
        buffer: Buffer.from('%PDF-1.4\nSynthetic acceptance file\n%%EOF'),
    })
    await page.getByRole('button', { name: 'Unggah dokumen', exact: true }).click()
}
export async function seedOrders(
    page: Page,
    inputs: readonly ScenarioModule.UatOrderInput[],
): Promise<ScenarioModule.UatOrder[]> {
    await page.goto('/app')
    return page.evaluate(async (entries) => {
        const origin = new URL(
            document.querySelector<HTMLScriptElement>('script[src*="/@vite/client"]')?.src ??
                location.origin,
        ).origin
        const { createUatOrder } = (await import(
            origin + '/tests/frontend/uat-scenario.ts'
        )) as typeof ScenarioModule
        const orders: ScenarioModule.UatOrder[] = []
        for (const entry of entries) orders.push(await createUatOrder(entry))
        return orders
    }, inputs)
}
