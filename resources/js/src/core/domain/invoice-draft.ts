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
export function validateInvoice(input: InvoiceInput): Partial<Record<keyof InvoiceInput, string>> {
    return {
        ...(!input.purchaseOrderId ? { purchaseOrderId: 'invoices.required' } : {}),
        ...(!input.invoiceDate ? { invoiceDate: 'invoices.required' } : {}),
        ...(input.direction === 'payable' && !input.mitraId
            ? { mitraId: 'invoices.required' }
            : {}),
        ...(!input.terms.length ||
        input.terms.some(
            (term) =>
                !term.label.trim() ||
                !/^\d+\.\d{2}$/.test(term.amount) ||
                /^0+\.00$/.test(term.amount),
        )
            ? { terms: 'invoices.invalidTerms' }
            : {}),
    }
}
