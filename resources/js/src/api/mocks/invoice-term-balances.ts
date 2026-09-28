import type { InvoiceTerm } from '@/core/types/invoice'
import type { InvoiceTermBalance } from '@/core/types/invoice-settlement'
import { moneyUnits, moneyAmount } from '@/core/domain/money-arithmetic'
export function allocateInvoiceCredit(
    terms: readonly InvoiceTerm[],
    credit: string,
    operationalDate: string,
): readonly InvoiceTermBalance[] {
    let available = moneyUnits(credit)
    if (
        available < 0n ||
        available > terms.reduce((sum, term) => sum + moneyUnits(term.amount), 0n)
    )
        throw new Error('Approved credit is outside term totals')
    const balances = new Map<number, InvoiceTermBalance>()
    const ordered = terms
        .map((term, index) => ({ term, index }))
        .sort(
            (a, b) =>
                (a.term.dueDate ?? '9999-99-99').localeCompare(b.term.dueDate ?? '9999-99-99') ||
                a.index - b.index,
        )
    for (const { term, index } of ordered) {
        const amount = moneyUnits(term.amount)
        const settled = available < amount ? available : amount
        available -= settled
        const outstanding = amount - settled
        balances.set(index, {
            ...term,
            index,
            settledAmount: moneyAmount(settled),
            outstandingAmount: moneyAmount(outstanding),
            overdue: !!term.dueDate && term.dueDate < operationalDate && outstanding > 0n,
        })
    }
    return terms.map((_, index) => {
        const balance = balances.get(index)
        if (!balance) throw new Error('Missing term balance')
        return balance
    })
}
