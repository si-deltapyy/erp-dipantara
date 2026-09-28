import { parseId } from '@/api/contracts/value-parsers'
import type { Payment, PaymentInput } from '@/core/types/payment'
import type { SessionUser } from '@/core/types/session'
import type { DemoTransaction } from './transaction'
import { ApiError } from '@/core/types/api-error'
import { assertRecordAccess } from '@/core/domain/record-policy'
import { sumMoney } from '@/core/domain/money-arithmetic'
import { paymentInvoice, paymentAccounts, paymentAccountLabel } from './payment-context'
export async function draftPayment(
    transaction: DemoTransaction,
    actor: SessionUser,
    input: PaymentInput,
    previous?: Payment,
): Promise<Payment> {
    if (previous && previous.invoiceId !== input.invoiceId) throw new ApiError('conflict')
    const invoice = await paymentInvoice(transaction, actor, input.invoiceId)
    const accounts = await paymentAccounts(transaction, input, invoice)
    const now = new Date().toISOString()
    const payment: Payment = {
        ...input,
        id: previous?.id ?? crypto.randomUUID(),
        ownerUserId: invoice.ownerUserId,
        purchaseOrderId: invoice.purchaseOrderId,
        purchaseOrderNumber: invoice.purchaseOrderNumber,
        invoiceNumber: invoice.number ?? '',
        counterpartyName: invoice.counterpartyName,
        direction: invoice.direction,
        sourceAccountLabel: paymentAccountLabel(accounts.source),
        destinationAccountLabel: paymentAccountLabel(accounts.destination),
        creditAmount: sumMoney([
            input.cashAmount,
            input.withholdingAmount,
            input.roundingAdjustment,
        ]),
        rejectionReason: previous?.rejectionReason ?? null,
        status: previous?.status ?? 'draft',
        createdAt: previous?.createdAt ?? now,
        updatedAt: now,
        version: (previous?.version ?? 0) + 1,
        createdByUserId: previous?.createdByUserId ?? parseId(actor.id),
        submittedByUserId: previous?.submittedByUserId ?? null,
        allowedActions: [],
    }
    assertRecordAccess(actor, previous ? 'payments.update' : 'payments.create', payment)
    return payment
}
