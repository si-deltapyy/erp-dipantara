import type { BankAccountInput, BankAccountQuery } from '@/core/types/bank-account'
import type { SessionUser } from '@/core/types/session'
import { ApiError } from '@/core/types/api-error'

export interface BankAccountInvoiceLink {
    readonly invoiceId: string
    readonly ownerUserId: string
    readonly counterpartyType: 'buyer' | 'mitra'
    readonly counterpartyId: string
}
export const bankAccountInvoiceFixtures: readonly BankAccountInvoiceLink[] = [
    {
        invoiceId: 'demo-invoice-buyer-one',
        ownerUserId: 'user-demo',
        counterpartyType: 'buyer',
        counterpartyId: 'demo-buyer-01',
    },
    {
        invoiceId: 'demo-invoice-mitra-one',
        ownerUserId: 'user-demo',
        counterpartyType: 'mitra',
        counterpartyId: 'demo-mitra-01',
    },
    {
        invoiceId: 'demo-invoice-buyer-two',
        ownerUserId: 'multiple-demo',
        counterpartyType: 'buyer',
        counterpartyId: 'demo-buyer-02',
    },
]
export function resolveBankAccountScope(
    actor: SessionUser,
    query: BankAccountQuery,
    invoices: readonly BankAccountInvoiceLink[],
): (account: BankAccountInput) => boolean {
    const all = actor.permissions.includes('bank-accounts.lookup.all')
    if (!all && !actor.permissions.includes('bank-accounts.lookup.own'))
        throw new ApiError('forbidden')
    if (!all && !query.invoiceId)
        throw new ApiError('validation', { invoiceId: ['bank-accounts.required'] })
    const invoice = query.invoiceId
        ? invoices.find((record) => record.invoiceId === query.invoiceId)
        : undefined
    if (query.invoiceId && (!invoice || (!all && invoice.ownerUserId !== actor.id)))
        throw new ApiError('not-found')
    return (account) =>
        (!query.ownerType || account.ownerType === query.ownerType) &&
        (!query.ownerId || account.ownerId === query.ownerId) &&
        (!invoice ||
            account.ownerType === 'company' ||
            (account.ownerType === invoice.counterpartyType &&
                account.ownerId === invoice.counterpartyId))
}
