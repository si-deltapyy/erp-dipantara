import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { login } from './session-helpers'
import {
    act,
    actors,
    captureEvidence,
    collectPageErrors,
    confirmDialog,
    expectPersisted,
    seedOrders,
    simulateUpdate,
    switchActor,
    uploadPdf,
} from './uat-helpers'
test.skip(process.env.E2E_PRODUCTION === 'true', 'Cross-role acceptance mock')
interface InvoiceDraft {
    readonly direction: 'receivable' | 'payable'
    readonly label: string
    readonly amount: string
}
interface PaymentDraft {
    readonly source: string
    readonly destination: string
    readonly amount: string
}
const buyerPayment = { source: 'demo-bank-account-02', destination: 'demo-bank-account-01' }
const mitraPayment = { source: 'demo-bank-account-01', destination: 'demo-bank-account-03' }
async function receiveShipment(page: Page, purchaseOrderId: string): Promise<void> {
    await login(page, actors.maker, '/app/deliveries/new')
    await page.getByLabel('Nomor PO', { exact: true }).selectOption(purchaseOrderId)
    await page.getByLabel('Nomor polisi', { exact: true }).fill('UAT 0003')
    await page.getByLabel(/Jumlah dialokasikan —/).fill('100')
    await page.getByRole('button', { name: 'Simpan draft', exact: true }).click()
    await expect(
        page.getByRole('heading', { name: 'Detail pengiriman', exact: true }),
    ).toBeVisible()
    for (const name of ['farmer.pdf', 'buyer.pdf']) {
        await uploadPdf(page, 'Pilih PDF SAKR', name)
        await expect(page.getByText('Dokumen tersimpan.', { exact: true })).toBeVisible()
    }
    await page.getByRole('link', { name: 'Edit pengiriman', exact: true }).click()
    for (const [label, file] of [
        ['Petani → Dipantara', 'farmer.pdf'],
        ['Dipantara → Buyer', 'buyer.pdf'],
    ] as const) {
        const group = page.getByRole('group', { name: label, exact: true })
        await group.getByLabel('Berkas SAKR', { exact: true }).selectOption({ label: file })
        await group.getByLabel('Nomor SAKR', { exact: true }).fill('UAT-' + file)
        await group.getByLabel('Tanggal SAKR', { exact: true }).fill('2026-09-28')
    }
    await page.getByRole('button', { name: 'Simpan draft', exact: true }).click()
    await act(page, 'Kirim pengiriman', 'Dikirim')
    await act(page, 'Tandai diterima', 'Diterima')
    await expectPersisted(page, 'Diterima')
}
async function issueInvoice(
    page: Page,
    purchaseOrderId: string,
    draft: InvoiceDraft,
): Promise<string> {
    await page.goto('/app/invoices/new')
    await page.getByLabel('Nomor PO', { exact: true }).selectOption(purchaseOrderId)
    await page.getByLabel('Arah tagihan', { exact: true }).selectOption(draft.direction)
    if (draft.direction === 'payable')
        await page.getByLabel('Mitra', { exact: true }).selectOption('demo-mitra-01')
    await page.getByLabel('Jenis invoice', { exact: true }).selectOption('settlement')
    await page.getByLabel('Nama termin', { exact: true }).fill(draft.label)
    await page.getByLabel('Nominal termin', { exact: true }).fill(draft.amount)
    await page.getByRole('button', { name: 'Simpan draft', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Detail invoice', exact: true })).toBeVisible()
    await act(page, 'Terbitkan invoice', 'Diterbitkan')
    return page.url()
}
async function submitPayment(page: Page, draft: PaymentDraft): Promise<string> {
    await page.getByRole('link', { name: 'Catat pembayaran', exact: true }).click()
    await page.getByLabel('Rekening sumber', { exact: true }).selectOption(draft.source)
    await page.getByLabel('Rekening tujuan', { exact: true }).selectOption(draft.destination)
    await page.getByLabel('Nominal cash', { exact: true }).fill(draft.amount)
    await uploadPdf(page, 'Pilih bukti pembayaran', 'proof.pdf')
    await expect(page.getByText('Bukti sudah tersedia.', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Simpan draft', exact: true }).click()
    await expect(
        page.getByRole('heading', { name: 'Detail pembayaran', exact: true }),
    ).toBeVisible()
    await expect(page.getByRole('button', { name: 'Setujui pembayaran' })).toHaveCount(0)
    await act(page, 'Ajukan pembayaran', 'Diajukan')
    return page.url()
}
async function approvePayment(page: Page, url: string): Promise<void> {
    await switchActor(page, actors.supervisor, url)
    await act(page, 'Setujui pembayaran', 'Disetujui')
}
async function reviseInvoice(page: Page, url: string): Promise<void> {
    await switchActor(page, actors.maker, url)
    await page.getByRole('link', { name: 'Revisi invoice', exact: true }).click()
    await page.getByLabel('Nominal termin', { exact: true }).fill('1700000.00')
    await page.getByLabel('Alasan revisi', { exact: true }).fill('Penyesuaian hasil grading')
    await page.getByRole('button', { name: 'Simpan draft revisi', exact: true }).click()
    await expect(page.getByText(/Versi issued aktif: 1/)).toBeVisible()
    await page.getByRole('button', { name: 'Terbitkan invoice', exact: true }).click()
    await confirmDialog(page)
    await expect(page.getByLabel('Versi invoice', { exact: true })).toHaveValue('2')
}
async function requestClosing(page: Page, purchaseOrderId: string): Promise<string> {
    await switchActor(page, actors.admin, '/app/closings/new?purchaseOrderId=' + purchaseOrderId)
    await expect(page.getByText('PO memenuhi prasyarat closing', { exact: true })).toBeVisible()
    await page.getByLabel('Catatan pengajuan', { exact: true }).fill('Seluruh tagihan lunas')
    await simulateUpdate(page, 'conflict')
    await page.getByRole('button', { name: 'Ajukan closing', exact: true }).click()
    await confirmDialog(page)
    await expect(page.getByRole('alert')).toContainText('Status atau versi telah berubah')
    await expect(page.getByLabel('Catatan pengajuan', { exact: true })).toHaveValue(
        'Seluruh tagihan lunas',
    )
    await simulateUpdate(page, 'success')
    await page.getByRole('button', { name: 'Periksa ulang kelayakan', exact: true }).click()
    await page.getByRole('button', { name: 'Ajukan closing', exact: true }).click()
    await confirmDialog(page)
    await expect(page.getByRole('heading', { name: 'Detail closing', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Setujui closing', exact: true })).toHaveCount(0)
    return page.url()
}
test('settles three shipments with instalments and a revision, then closes the order', async ({
    page,
}, info) => {
    test.setTimeout(300000)
    const errors = collectPageErrors(page)
    const [order] = await seedOrders(page, [
        {
            ownerId: 'user-demo',
            number: 'UAT-FINANCE-01',
            quantity: 500,
            graderNumber: 1,
            shipments: [200, 200],
        },
    ])
    if (!order) throw new Error('Missing seeded order')
    await test.step('maker receives the third shipment', () =>
        receiveShipment(page, order.purchaseOrderId))
    const invoiceUrl = await test.step('maker issues the buyer invoice', () =>
        issueInvoice(page, order.purchaseOrderId, {
            direction: 'receivable',
            label: 'Pelunasan Buyer',
            amount: '2000000.00',
        }))
    await test.step('owner pays the first instalment', async () => {
        await switchActor(page, actors.user, invoiceUrl)
        await approvePayment(
            page,
            await submitPayment(page, { ...buyerPayment, amount: '1000000.00' }),
        )
    })
    await test.step('maker revises the invoice after payment', () =>
        reviseInvoice(page, invoiceUrl))
    await test.step('owner pays the remaining instalment', async () => {
        await switchActor(page, actors.user, invoiceUrl)
        await approvePayment(
            page,
            await submitPayment(page, { ...buyerPayment, amount: '700000.00' }),
        )
        await page.goto(invoiceUrl)
        await page.getByRole('link', { name: 'Pantau pembayaran', exact: true }).click()
        await expect(page.getByText('2 pembayaran', { exact: true })).toBeVisible()
        await expect(page.getByText('Rp 1.000.000,00', { exact: true })).toBeVisible()
        await expect(page.getByText('Rp 700.000,00', { exact: true })).toBeVisible()
    })
    await test.step('maker settles the partner invoice', async () => {
        await switchActor(page, actors.maker, '/app/invoices')
        await issueInvoice(page, order.purchaseOrderId, {
            direction: 'payable',
            label: 'Pelunasan Mitra',
            amount: '100000.00',
        })
        await approvePayment(
            page,
            await submitPayment(page, { ...mitraPayment, amount: '100000.00' }),
        )
    })
    const closingUrl = await test.step('admin requests closing', () =>
        requestClosing(page, order.purchaseOrderId))
    await test.step('supervisor approves closing and the order locks', async () => {
        await switchActor(page, actors.supervisor, closingUrl)
        await act(page, 'Setujui closing', 'Disetujui')
        await captureEvidence(page, info, 'finance-flow')
        await page.getByRole('link', { name: 'Buka PO', exact: true }).click()
        await expect(page.getByText('PO telah ditutup', { exact: true })).toBeVisible()
        await expectPersisted(page, 'PO telah ditutup')
        await switchActor(page, actors.maker, invoiceUrl)
        await expect(page.getByRole('link', { name: 'Revisi invoice', exact: true })).toHaveCount(0)
        await expect(page.getByRole('link', { name: 'Catat pembayaran', exact: true })).toHaveCount(
            0,
        )
    })
    expect(errors).toEqual([])
})
