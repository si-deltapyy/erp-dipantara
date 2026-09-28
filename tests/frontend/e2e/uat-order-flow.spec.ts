import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { login } from './session-helpers'
import { submitGrading } from './grading-helpers'
import {
    act,
    actors,
    captureEvidence,
    collectPageErrors,
    confirmDialog,
    expectPersisted,
    recordId,
    reject,
    simulateUpdate,
    switchActor,
} from './uat-helpers'
test.skip(process.env.E2E_PRODUCTION === 'true', 'Cross-role acceptance mock')
const purchaseOrders = '/app/purchase-orders'
async function requestPurchaseOrder(page: Page): Promise<string> {
    await login(page, actors.user, purchaseOrders + '/new')
    await page.getByLabel('Buyer', { exact: true }).selectOption('demo-buyer-01')
    await page.getByLabel('Nomor PO', { exact: true }).fill('UAT-ORDER-01')
    await page.getByLabel('Tanggal PO', { exact: true }).fill('2026-09-28')
    await page.getByLabel('Kayu baris 1', { exact: true }).selectOption('demo-timber-01')
    await page.getByLabel('Jumlah baris 1', { exact: true }).fill('5')
    await page.getByLabel('Harga satuan baris 1', { exact: true }).fill('3400.00')
    await page.getByRole('button', { name: 'Simpan draft', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Detail PO', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Setujui PO', exact: true })).toHaveCount(0)
    await act(page, 'Submit PO', 'Diajukan')
    return page.url()
}
async function reviseRejectedPurchaseOrder(page: Page, url: string): Promise<void> {
    await switchActor(page, actors.user, url)
    await expect(page.getByText('Jumlah melebihi kebutuhan', { exact: true })).toBeVisible()
    await page.getByRole('link', { name: 'Edit PO', exact: true }).click()
    await page.getByLabel('Jumlah baris 1', { exact: true }).fill('4')
    await page.getByRole('button', { name: 'Simpan draft', exact: true }).click()
    await act(page, 'Submit PO', 'Diajukan')
}
async function rejectConflictingApproval(page: Page, url: string): Promise<void> {
    await switchActor(page, actors.admin, url)
    await simulateUpdate(page, 'conflict')
    await page.getByRole('button', { name: 'Setujui PO', exact: true }).click()
    await confirmDialog(page)
    await expect(page.getByText('Versi data tidak sesuai.', { exact: true })).toBeVisible()
    await expect(page.getByText('Diajukan', { exact: true })).toBeVisible()
    await page.getByRole('dialog').getByRole('button', { name: 'Muat ulang', exact: true }).click()
    await simulateUpdate(page, 'success')
    await expectPersisted(page, 'Diajukan')
}
async function processOrder(page: Page, purchaseOrderId: string): Promise<string> {
    await switchActor(page, actors.maker, '/app/orders/new')
    await page.getByLabel('Nomor PO', { exact: true }).selectOption(purchaseOrderId)
    await page.getByRole('button', { name: 'Simpan draft', exact: true }).click()
    for (const suffix of ['01', '02']) {
        await page.getByRole('button', { name: 'Tambah alokasi', exact: true }).click()
        await page.getByLabel('Mitra', { exact: true }).selectOption('demo-mitra-' + suffix)
        await page.getByLabel('Grader', { exact: true }).selectOption('demo-grader-' + suffix)
        await page.getByLabel('Kayu', { exact: true }).selectOption('demo-timber-01')
        await page.getByLabel('Jumlah alokasi', { exact: true }).fill('2')
        await page.getByRole('button', { name: 'Simpan alokasi', exact: true }).click()
        await expect(
            page.getByRole('button', { name: 'Tambah alokasi', exact: true }),
        ).toBeVisible()
    }
    await expect(page.getByRole('button', { name: 'Setujui order', exact: true })).toHaveCount(0)
    await act(page, 'Submit order', 'Diajukan')
    return page.url()
}
async function enterGrading(page: Page, email: string, diameter: string): Promise<string> {
    await switchActor(page, email, '/app/assignments')
    await page.getByRole('link', { name: 'Buka penugasan', exact: true }).click()
    await expect(page.getByText(/Rp\s?\d/)).toHaveCount(0)
    await page.getByRole('link', { name: 'Tambah grading', exact: true }).click()
    await page.getByLabel('Jumlah batang', { exact: true }).fill('2')
    await page.getByLabel('Diameter (cm)', { exact: true }).fill(diameter)
    await page.getByLabel('Panjang (m)', { exact: true }).fill('2')
    await page.getByRole('button', { name: 'Simpan draft', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Detail grading', exact: true })).toBeVisible()
    await submitGrading(page)
    return page.url()
}
async function correctGrading(page: Page, url: string): Promise<string> {
    await switchActor(page, actors.graderOne, url)
    await page.getByRole('link', { name: 'Revisi grading', exact: true }).click()
    await page
        .getByLabel('Alasan revisi', { exact: true })
        .fill('Koreksi diameter hasil ukur ulang')
    await page.getByLabel('Diameter (cm)', { exact: true }).fill('20')
    await page.getByRole('button', { name: 'Simpan draft revisi', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Detail grading', exact: true })).toBeVisible()
    await submitGrading(page)
    return page.url()
}
test('hands a purchase order from request to corrected grading across five roles', async ({
    page,
}, info) => {
    test.setTimeout(300000)
    const errors = collectPageErrors(page)
    const purchaseOrderUrl = await test.step('user requests a purchase order', () =>
        requestPurchaseOrder(page))
    await test.step('supervisor rejects and the owner resubmits', async () => {
        await switchActor(page, actors.supervisor, purchaseOrderUrl)
        await reject(page, 'Tolak PO', 'Jumlah melebihi kebutuhan')
        await expectPersisted(page, 'Jumlah melebihi kebutuhan')
        await reviseRejectedPurchaseOrder(page, purchaseOrderUrl)
    })
    await test.step('a failed approval leaves the record submitted', () =>
        rejectConflictingApproval(page, purchaseOrderUrl))
    await test.step('supervisor approves the purchase order', async () => {
        await switchActor(page, actors.supervisor, purchaseOrderUrl)
        await act(page, 'Setujui PO', 'Disetujui')
        await expectPersisted(page, 'Disetujui')
    })
    const orderUrl = await test.step('maker allocates two graders', () =>
        processOrder(page, recordId(page)))
    await test.step('supervisor approves the order', async () => {
        await switchActor(page, actors.supervisor, orderUrl)
        await act(page, 'Setujui order', 'Disetujui')
    })
    const first = await test.step('first grader records measurements', () =>
        enterGrading(page, actors.graderOne, '25'))
    const second = await test.step('second grader records measurements', () =>
        enterGrading(page, actors.graderTwo, '30'))
    await test.step('graders cannot read each other', async () => {
        await page.goto(first)
        await expect(
            page.getByText('Grading tidak ditemukan atau tidak dapat diakses.', { exact: true }),
        ).toBeVisible()
    })
    await test.step('supervisor approves both gradings', async () => {
        await switchActor(page, actors.supervisor, first)
        await act(page, 'Setujui grading', 'Disetujui')
        await page.goto(second)
        await act(page, 'Setujui grading', 'Disetujui')
    })
    const revision = await test.step('first grader corrects the diameter', () =>
        correctGrading(page, first))
    await test.step('supervisor approves the correction', async () => {
        await switchActor(page, actors.supervisor, revision)
        await act(page, 'Setujui grading', 'Disetujui')
        await expect(
            page.getByRole('region', { name: 'Hasil sebelumnya', exact: true }),
        ).toContainText('Digantikan revisi')
        await expectPersisted(page, 'Disetujui')
        await captureEvidence(page, info, 'order-flow')
    })
    expect(errors).toEqual([])
})
