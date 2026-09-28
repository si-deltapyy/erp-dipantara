import { paymentDraft } from '../../resources/js/src/core/domain/payment-draft'
import type { prepareClosedOrder } from './closed-order-scenario'
type Setup = Awaited<ReturnType<typeof prepareClosedOrder>>
export function financialClosedWrites(setup: Setup): [string, () => Promise<unknown>][] {
    const { context, invoice, payment } = setup
    const { po, maker, owner, signal, generation } = context
    const invoiceInput = {
        purchaseOrderId: po.id,
        mitraId: invoice.mitraId,
        direction: invoice.direction,
        kind: invoice.kind,
        invoiceDate: invoice.invoiceDate,
        terms: invoice.terms,
        notes: null,
    }
    const writes: [string, () => Promise<unknown>][] = [
        [
            'invoice-create',
            () =>
                context.invoices.mutate(
                    maker,
                    { action: 'create', input: invoiceInput, key: 'closed-invoice-create' },
                    generation,
                    signal,
                ),
        ],
        [
            'invoice-update',
            () =>
                context.invoices.mutate(
                    maker,
                    {
                        action: 'update',
                        id: invoice.id,
                        input: {
                            ...invoiceInput,
                            version: invoice.version,
                            revisionNumber: invoice.revisionNumber,
                        },
                        key: 'closed-invoice-update',
                    },
                    generation,
                    signal,
                ),
        ],
        [
            'invoice-revise',
            () =>
                context.invoices.mutate(
                    maker,
                    {
                        action: 'revise',
                        id: invoice.id,
                        input: {
                            version: invoice.version,
                            terms: invoice.terms,
                            reason: 'Late change',
                        },
                        key: 'closed-invoice',
                    },
                    generation,
                    signal,
                ),
        ],
        [
            'invoice-issue',
            () =>
                context.invoices.mutate(
                    maker,
                    {
                        action: 'issue',
                        id: invoice.id,
                        input: { version: invoice.version, revisionNumber: invoice.revisionNumber },
                        key: 'closed-invoice-issue',
                    },
                    generation,
                    signal,
                ),
        ],
        [
            'payment-create',
            () =>
                context.payments.mutate(
                    owner,
                    {
                        action: 'create',
                        input: paymentDraft(payment),
                        key: 'closed-payment-create',
                    },
                    generation,
                    signal,
                ),
        ],
        [
            'payment-update',
            () =>
                context.payments.mutate(
                    owner,
                    {
                        action: 'update',
                        id: payment.id,
                        input: { ...paymentDraft(payment), version: payment.version },
                        key: 'closed-payment-update',
                    },
                    generation,
                    signal,
                ),
        ],
    ]
    return writes
}
