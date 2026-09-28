import type { Payment, PaymentInput } from '@/core/types/payment'
import { moneyUnits, sumMoney } from './money-arithmetic'
export function paymentDraft(payment?: Payment, invoiceId = ''): PaymentInput {
    return {
        invoiceId: payment?.invoiceId ?? invoiceId,
        paymentDate:
            payment?.paymentDate ??
            new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' }),
        sourceAccountId: payment?.sourceAccountId ?? '',
        destinationAccountId: payment?.destinationAccountId ?? '',
        cashAmount: payment?.cashAmount ?? '',
        withholdingAmount: payment?.withholdingAmount ?? '0.00',
        roundingAdjustment: payment?.roundingAdjustment ?? '0.00',
        proofDocumentId: payment?.proofDocumentId ?? '',
        notes: payment?.notes ?? null,
    }
}
export function validatePayment(input: PaymentInput): Partial<Record<keyof PaymentInput, string>> {
    const errors: Partial<Record<keyof PaymentInput, string>> = {}
    for (const field of [
        'invoiceId',
        'paymentDate',
        'sourceAccountId',
        'destinationAccountId',
        'proofDocumentId',
    ] as const)
        if (!input[field]) errors[field] = 'payments.required'
    for (const field of ['cashAmount', 'withholdingAmount', 'roundingAdjustment'] as const) {
        if (
            !/^-?\d+\.\d{2}$/.test(input[field]) ||
            input[field].length > 20 ||
            (field !== 'roundingAdjustment' && input[field].startsWith('-'))
        )
            errors[field] = 'payments.invalidAmount'
    }
    if (
        !errors.cashAmount &&
        !errors.withholdingAmount &&
        !errors.roundingAdjustment &&
        moneyUnits(
            sumMoney([input.cashAmount, input.withholdingAmount, input.roundingAdjustment]),
        ) <= 0n
    )
        errors.cashAmount = 'payments.invalidAmount'
    return errors
}
