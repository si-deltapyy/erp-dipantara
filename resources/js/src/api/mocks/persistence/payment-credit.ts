import type { DemoTransaction } from './transaction'
import { sumMoney } from '@/core/domain/money-arithmetic'
export async function approvedPaymentCredit(
    transaction: DemoTransaction,
    invoiceId: string,
): Promise<string> {
    return sumMoney(
        (await transaction.list('payments'))
            .filter((payment) => payment.invoiceId === invoiceId && payment.status === 'approved')
            .map((payment) => payment.creditAmount),
    )
}
