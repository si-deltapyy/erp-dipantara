import type { Payment } from '@/core/types/payment'
import type { DemoTransaction } from './transaction'
import { approvedPaymentCredit } from './payment-credit'
import { activeInvoice, normalizeIssuedInvoice } from './invoice-settlement'
import { ApiError } from '@/core/types/api-error'
import { moneyUnits } from '@/core/domain/money-arithmetic'
export async function reviewPayment(
    transaction: DemoTransaction,
    payment: Payment,
    action: 'approve' | 'reject',
    reason: string | null,
): Promise<Payment> {
    if (action === 'approve') {
        const stored = await transaction.get('invoices', payment.invoiceId)
        const invoice = stored
            ? await activeInvoice(transaction, normalizeIssuedInvoice(stored))
            : undefined
        if (!invoice) throw new ApiError('conflict')
        const credit = await approvedPaymentCredit(transaction, payment.invoiceId)
        if (moneyUnits(credit) + moneyUnits(payment.creditAmount) > moneyUnits(invoice.totalAmount))
            throw new ApiError('conflict', { cashAmount: ['payments.overpayment'] })
    }
    return {
        ...payment,
        status: action === 'approve' ? 'approved' : 'rejected',
        rejectionReason: action === 'reject' ? reason : null,
        version: payment.version + 1,
        updatedAt: new Date().toISOString(),
    }
}
