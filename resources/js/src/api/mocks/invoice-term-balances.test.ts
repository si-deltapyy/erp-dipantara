import { expect, test } from 'vitest'
import { allocateInvoiceCredit } from './invoice-term-balances'
const terms = [
    { label: 'Undated', amount: '300.00', dueDate: null },
    { label: 'First dated', amount: '200.00', dueDate: '2026-09-27' },
    { label: 'Second dated', amount: '100.00', dueDate: '2026-09-27' },
    { label: 'Today', amount: '400.00', dueDate: '2026-09-28' },
]
test('allocates credit by due date then input order and does not mark undated or today overdue', () => {
    const result = allocateInvoiceCredit(terms, '250.00', '2026-09-28')
    expect(result.map((term) => term.outstandingAmount)).toEqual([
        '300.00',
        '0.00',
        '50.00',
        '400.00',
    ])
    expect(result.map((term) => term.overdue)).toEqual([false, false, true, false])
    expect(
        allocateInvoiceCredit(terms, '1000.00', '2026-10-01').every(
            (term) => !term.overdue && term.outstandingAmount === '0.00',
        ),
    ).toBe(true)
    expect(() => allocateInvoiceCredit(terms, '-1.00', '2026-09-28')).toThrow()
    expect(() => allocateInvoiceCredit(terms, '1000.01', '2026-09-28')).toThrow()
})
