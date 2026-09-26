import { expect, test } from 'vitest'
import { resolveBankAccountScope, bankAccountInvoiceFixtures } from './bank-account-lookup-scope'
import { bankAccountFixtures } from './bank-account-fixtures'
import { requireBankAccountPermission } from './bank-account-policy'
import type { SessionUser } from '@/core/types/session'

const actor: SessionUser = {
    id: 'user-demo',
    displayName: 'Demo',
    roles: ['admin'],
    permissions: ['bank-accounts.lookup.own'],
    developmentCapabilities: [],
}
const query = { page: 1, perPage: 20, search: '', sort: 'createdAt' as const }
test('requires explicit permissions and authorized invoice context', () => {
    expect(() => requireBankAccountPermission(actor, 'read')).toThrow()
    expect(() => requireBankAccountPermission(null, 'lookup')).toThrow()
    expect(() => resolveBankAccountScope(actor, query, bankAccountInvoiceFixtures)).toThrow()
    for (const invoiceId of ['missing', 'demo-invoice-buyer-two']) {
        try {
            resolveBankAccountScope(actor, { ...query, invoiceId }, bankAccountInvoiceFixtures)
        } catch (cause) {
            expect(cause).toMatchObject({ kind: 'not-found' })
            continue
        }
        throw new Error('Unauthorized invoice accepted')
    }
})
test('restricts direction to the company and invoice counterparty before pagination', () => {
    const buyerScope = resolveBankAccountScope(
        actor,
        { ...query, invoiceId: 'demo-invoice-buyer-one' },
        bankAccountInvoiceFixtures,
    )
    const mitraScope = resolveBankAccountScope(
        actor,
        { ...query, invoiceId: 'demo-invoice-mitra-one' },
        bankAccountInvoiceFixtures,
    )
    const buyers = bankAccountFixtures.filter(buyerScope)
    const mitras = bankAccountFixtures.filter(mitraScope)
    expect(buyers).toHaveLength(9)
    expect(mitras).toHaveLength(9)
    expect(
        buyers.every(
            (account) => account.ownerType === 'company' || account.ownerId === 'demo-buyer-01',
        ),
    ).toBe(true)
    expect(
        mitras.every(
            (account) => account.ownerType === 'company' || account.ownerId === 'demo-mitra-01',
        ),
    ).toBe(true)
    expect(
        bankAccountFixtures.filter(
            resolveBankAccountScope(
                actor,
                { ...query, invoiceId: 'demo-invoice-buyer-one', ownerId: 'demo-buyer-02' },
                bankAccountInvoiceFixtures,
            ),
        ),
    ).toEqual([])
})
test('all permission permits the catalog but supplied invoice still limits candidates', () => {
    const all = { ...actor, permissions: ['bank-accounts.lookup.all'] }
    expect(
        bankAccountFixtures.filter(resolveBankAccountScope(all, query, bankAccountInvoiceFixtures)),
    ).toHaveLength(24)
    expect(
        bankAccountFixtures.filter(
            resolveBankAccountScope(
                all,
                { ...query, invoiceId: 'demo-invoice-buyer-two' },
                bankAccountInvoiceFixtures,
            ),
        ),
    ).toHaveLength(9)
    expect(() =>
        resolveBankAccountScope({ ...actor, permissions: [] }, query, bankAccountInvoiceFixtures),
    ).toThrow()
})
