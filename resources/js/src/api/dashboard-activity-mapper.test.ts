import { expect, it } from 'vitest'
import { parseActivityList } from './dashboard-activity-mapper'
const record = {
    resource: 'invoices',
    id: 'invoice-one',
    label: 'INV-ONE',
    purchaseOrderNumber: 'PO-ONE',
    status: 'issued',
    updatedAt: '2026-09-28T12:00:00Z',
    targetPath: '/invoices/invoice-one',
}
it('maps safe scoped activity without financial or document fields', () => {
    expect(parseActivityList([record])).toEqual([record])
    expect(parseActivityList([])).toEqual([])
})
it.each([
    { ...record, targetPath: '/payments/invoice-one' },
    { ...record, targetPath: 'https://example.test' },
    { ...record, targetPath: '/invoices/other' },
    { ...record, status: 'closed' },
    { ...record, updatedAt: 'yesterday' },
    { ...record, purchasePrice: '100.00' },
])('rejects unknown, mismatched or overexposed activity %j', (invalid) => {
    expect(() => parseActivityList([invalid])).toThrow()
})
it('rejects duplicate identities and more than ten recent records', () => {
    expect(() => parseActivityList([record, record])).toThrow()
    expect(() =>
        parseActivityList(
            Array.from({ length: 11 }, (_, index) => ({
                ...record,
                id: String(index),
                targetPath: '/invoices/' + index,
            })),
        ),
    ).toThrow()
})
