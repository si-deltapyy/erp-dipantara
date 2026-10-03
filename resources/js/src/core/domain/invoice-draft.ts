import { isCalendarDate } from './input-validation'
import type { Invoice, InvoiceInput } from '@/core/types/invoice'
export function invoiceDraft(invoice?: Invoice): InvoiceInput {
    return {
        purchaseOrderId: invoice?.purchaseOrderId ?? '',
        mitraId: invoice?.mitraId ?? null,
        direction: invoice?.direction ?? 'receivable',
        kind: invoice?.kind ?? 'down_payment',
        invoiceDate:
            invoice?.invoiceDate ??
            new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' }),
        terms: invoice?.terms.map((term) => ({ ...term })) ?? [
            { label: '', amount: '', dueDate: null },
        ],
        notes: invoice?.notes ?? null,
    }
}
export function validateInvoice(input: InvoiceInput): Record<string, string> {
    const errors: Record<string, string> = {}
    if (!input.purchaseOrderId.trim()) errors.purchaseOrderId = 'invoices.required'
    if (!isCalendarDate(input.invoiceDate)) errors.invoiceDate = 'ui.validation.date'
    if (!['receivable', 'payable'].includes(input.direction)) errors.direction = 'invoices.invalid'
    if (!['down_payment', 'settlement'].includes(input.kind)) errors.kind = 'invoices.invalid'
    if (input.direction === 'payable' && !input.mitraId?.trim())
        errors.mitraId = 'invoices.required'
    if (input.notes && [...input.notes].length > 2000) errors.notes = 'invoices.invalid'
    if (!input.terms.length || input.terms.length > 50) errors.terms = 'invoices.invalidTerms'
    input.terms.forEach((term, index) => {
        if (!term.label.trim()) errors[`terms.${index}.label`] = 'ui.validation.required'
        else if ([...term.label].length > 255)
            errors[`terms.${index}.label`] = 'ui.validation.textLength'
        if (
            !/^\d+\.\d{2}$/.test(term.amount) ||
            /^0+\.00$/.test(term.amount) ||
            term.amount.length > 20
        )
            errors[`terms.${index}.amount`] = 'invoices.invalidTerms'
        if (term.dueDate !== null && !isCalendarDate(term.dueDate))
            errors[`terms.${index}.dueDate`] = 'ui.validation.date'
    })
    return errors
}
