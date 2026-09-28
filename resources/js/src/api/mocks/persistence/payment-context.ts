import type { PaymentInput } from '@/core/types/payment'
import type { SessionUser } from '@/core/types/session'
import type { Invoice } from '@/core/types/invoice'
import type { BankAccount } from '@/core/types/bank-account'
import type { DemoTransaction } from './transaction'
import { ApiError } from '@/core/types/api-error'
import { assertRecordAccess } from '@/core/domain/record-policy'
import { activeInvoice, normalizeIssuedInvoice } from './invoice-settlement'
export async function paymentInvoice(
    transaction: DemoTransaction,
    actor: SessionUser,
    invoiceId: string,
): Promise<Invoice> {
    const stored = await transaction.get('invoices', invoiceId)
    if (!stored) throw new ApiError('not-found')
    assertRecordAccess(actor, 'invoices.read', stored)
    const issued = await activeInvoice(transaction, normalizeIssuedInvoice(stored))
    if (!issued) throw new ApiError('validation', { invoiceId: ['payments.invoiceNotIssued'] })
    const parent = await transaction.get('purchase-orders', issued.purchaseOrderId)
    if (!parent || parent.status !== 'approved') throw new ApiError('conflict')
    return issued
}
export async function paymentAccounts(
    transaction: DemoTransaction,
    input: PaymentInput,
    invoice: Invoice,
): Promise<{ source: BankAccount; destination: BankAccount }> {
    const source = await transaction.get('bank-accounts', input.sourceAccountId)
    const destination = await transaction.get('bank-accounts', input.destinationAccountId)
    const po = await transaction.get('purchase-orders', invoice.purchaseOrderId)
    if (!source || !destination || !po)
        throw new ApiError('validation', { sourceAccountId: ['payments.invalidAccounts'] })
    const counterpartyType = invoice.direction === 'receivable' ? 'buyer' : 'mitra'
    const counterpartyId = invoice.direction === 'receivable' ? po.buyerId : invoice.mitraId
    const fromCompany = invoice.direction === 'payable'
    const company = fromCompany ? source : destination
    const counterparty = fromCompany ? destination : source
    if (
        source.id === destination.id ||
        company.ownerType !== 'company' ||
        counterparty.ownerType !== counterpartyType ||
        counterparty.ownerId !== counterpartyId
    )
        throw new ApiError('validation', {
            sourceAccountId: ['payments.invalidAccounts'],
            destinationAccountId: ['payments.invalidAccounts'],
        })
    return { source, destination }
}
export function paymentAccountLabel(account: BankAccount): string {
    return `${account.bankName} - ${account.accountNumber} - ${account.accountHolder}`
}
