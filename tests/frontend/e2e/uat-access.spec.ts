import { expect, test } from '@playwright/test'
import type { Page, TestInfo } from '@playwright/test'
import { login } from './session-helpers'
import {
    act,
    actors,
    captureEvidence,
    collectPageErrors,
    seedOrders,
    switchActor,
} from './uat-helpers'
test.skip(process.env.E2E_PRODUCTION === 'true', 'Cross-role acceptance mock')
interface RoleAccess {
    readonly email: string
    readonly menu: readonly string[]
    readonly denied: readonly string[]
}
const operations = ['Purchase Order', 'Order', 'Pengiriman', 'Invoice', 'Pembayaran']
const grading = ['Penugasan Grader', 'Grading']
const oversight = ['Closing PO', 'Riwayat Buyer', 'Laporan harga beli']
const masters = ['Master Grader', 'Master Mitra', 'Master Rekening', 'Master Kayu', 'Master Buyer']
const entries = [...operations, ...grading, ...oversight, 'Produksi bulanan', ...masters]
const masterRoutes = ['/app/master-data/buyers', '/app/master-data/graders']
const processing = ['/app/orders/new', '/app/invoices/new', '/app/deliveries/new']
const finance = ['/app/invoices', '/app/payments', '/app/closings']
const reports = ['/app/reports/purchase-prices', '/app/reports/buyer-history']
const roles: readonly RoleAccess[] = [
    { email: actors.admin, menu: entries, denied: [] },
    {
        email: actors.user,
        menu: operations,
        denied: [...processing, ...reports, ...masterRoutes, '/app/closings', '/app/gradings'],
    },
    {
        email: actors.maker,
        menu: [...operations, ...grading, ...oversight, 'Produksi bulanan'],
        denied: [...masterRoutes, '/app/purchase-orders/new', '/app/closings/new'],
    },
    {
        email: actors.supervisor,
        menu: [...operations, ...grading, ...oversight, 'Produksi bulanan'],
        denied: [...masterRoutes, ...processing, '/app/purchase-orders/new', '/app/closings/new'],
    },
    {
        email: actors.graderOne,
        menu: [...grading, 'Pengiriman', 'Produksi bulanan'],
        denied: [...processing, ...finance, ...reports, ...masterRoutes, '/app/purchase-orders'],
    },
    {
        email: actors.multiple,
        menu: [...operations, ...grading, 'Produksi bulanan'],
        denied: [...processing, ...reports, ...masterRoutes, '/app/closings'],
    },
]
async function expectMenu(page: Page, info: TestInfo, menu: readonly string[]): Promise<void> {
    if (info.project.name === 'mobile')
        await page.getByRole('button', { name: 'Buka navigasi' }).click()
    for (const entry of entries) {
        const link = page.getByRole('link', { name: entry, exact: true }).filter({ visible: true })
        await expect(link).toHaveCount(menu.includes(entry) ? 1 : 0)
    }
    if (info.project.name === 'mobile') await page.keyboard.press('Escape')
}
async function expectMissing(page: Page, path: string, message: string): Promise<void> {
    await page.goto(path)
    await expect(page.getByText(message, { exact: true })).toBeVisible()
}
async function expectTotal(page: Page, total: string): Promise<void> {
    await page.goto('/app/purchase-orders')
    await page.getByLabel('Cari nomor PO atau Buyer', { exact: true }).fill('UAT-ACCESS')
    await page.getByRole('button', { name: 'Terapkan filter' }).click()
    await expect(page.getByText(total, { exact: true })).toBeVisible()
}
test('limits menus and direct routes to the permissions of every role', async ({ page }, info) => {
    test.setTimeout(300000)
    const errors = collectPageErrors(page)
    await login(page, actors.admin, '/app')
    for (const role of roles) {
        await switchActor(page, role.email, '/app')
        await expectMenu(page, info, role.menu)
        for (const path of role.denied) {
            await page.goto(path)
            await expect(page).toHaveURL(/forbidden/)
        }
    }
    expect(errors).toEqual([])
})
test('hides records outside scope, hides prices from graders and blocks self review', async ({
    page,
}, info) => {
    test.setTimeout(300000)
    const errors = collectPageErrors(page)
    const [own, foreign] = await seedOrders(page, [
        {
            ownerId: 'user-demo',
            number: 'UAT-ACCESS-01',
            quantity: 2,
            graderNumber: 1,
            shipments: [],
        },
        {
            ownerId: 'multiple-demo',
            number: 'UAT-ACCESS-02',
            quantity: 2,
            graderNumber: 2,
            shipments: [],
        },
    ])
    if (!own || !foreign) throw new Error('Missing seeded orders')
    await test.step('owner reads own records only', async () => {
        await login(page, actors.user, '/app/purchase-orders/' + own.purchaseOrderId)
        await expect(
            page.getByRole('heading', { name: 'UAT-ACCESS-01', exact: true }),
        ).toBeVisible()
        await expectMissing(
            page,
            '/app/purchase-orders/' + foreign.purchaseOrderId,
            'PO tidak ditemukan atau tidak dapat diakses.',
        )
        await expect(page.getByText('UAT-ACCESS-02', { exact: true })).toHaveCount(0)
        await expectMissing(
            page,
            '/app/orders/' + foreign.orderId,
            'Order tidak ditemukan atau tidak dapat diakses.',
        )
        await expectTotal(page, '1 PO')
    })
    await test.step('grader reads the assigned grading without prices', async () => {
        await switchActor(page, actors.graderOne, '/app/gradings/' + own.gradingId)
        await expect(
            page.getByRole('heading', { name: 'Detail grading', exact: true }),
        ).toBeVisible()
        await expect(page.getByText(/Rp\s?\d/)).toHaveCount(0)
        await expectMissing(
            page,
            '/app/gradings/' + foreign.gradingId,
            'Grading tidak ditemukan atau tidak dapat diakses.',
        )
        await page.goto('/app/assignments')
        await expect(page.getByRole('link', { name: 'Buka penugasan', exact: true })).toHaveCount(1)
        await expect(page.getByText(/Rp\s?\d/)).toHaveCount(0)
    })
    await test.step('maker reads every owner', async () => {
        await switchActor(page, actors.maker, '/app')
        await expectTotal(page, '2 PO')
    })
    await test.step('creator cannot approve the submitted record', async () => {
        await switchActor(page, actors.admin, '/app/purchase-orders/new')
        await page.getByLabel('Buyer', { exact: true }).selectOption('demo-buyer-01')
        await page.getByLabel('Nomor PO', { exact: true }).fill('UAT-ACCESS-SELF')
        await page.getByLabel('Tanggal PO', { exact: true }).fill('2026-09-28')
        await page.getByLabel('Kayu baris 1', { exact: true }).selectOption('demo-timber-01')
        await page.getByLabel('Jumlah baris 1', { exact: true }).fill('1')
        await page.getByLabel('Harga satuan baris 1', { exact: true }).fill('3400.00')
        await page.getByRole('button', { name: 'Simpan draft', exact: true }).click()
        await act(page, 'Submit PO', 'Diajukan')
        await page.reload()
        await expect(page.getByRole('button', { name: 'Setujui PO', exact: true })).toHaveCount(0)
        await expect(page.getByRole('button', { name: 'Tolak PO', exact: true })).toHaveCount(0)
        await captureEvidence(page, info, 'access')
        await switchActor(page, actors.supervisor, page.url())
        await expect(page.getByRole('button', { name: 'Setujui PO', exact: true })).toBeVisible()
    })
    expect(errors).toEqual([])
})
