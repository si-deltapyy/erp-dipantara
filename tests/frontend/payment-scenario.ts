import { createApprovedGradingScenario } from './grading-scenario'
import { InvoiceRepository } from '../../resources/js/src/api/mocks/persistence/invoice-repository'
import { PaymentRepository } from '../../resources/js/src/api/mocks/persistence/payment-repository'
import { DocumentRepository } from '../../resources/js/src/api/mocks/persistence/document-repository'
import { sessionFixtures } from '../../resources/js/src/api/mocks/session-fixtures'
export async function createPaymentScenario(
    name?: string,
): Promise<Awaited<ReturnType<typeof buildPaymentScenario>>> {
    return buildPaymentScenario(name)
}
async function buildPaymentScenario(name?: string) {
    const context = await createApprovedGradingScenario(name)
    const { options, maker, generation, signal } = context
    const owner = sessionFixtures.find((actor) => actor.id === 'user-demo')
    const other = sessionFixtures.find((actor) => actor.id === 'multiple-demo')
    if (!owner || !other) throw new Error('Missing actors')
    const invoices = new InvoiceRepository(options)
    const payments = new PaymentRepository(options)
    const documents = new DocumentRepository(options)
    const draft = await invoices.mutate(
        maker,
        {
            action: 'create',
            input: {
                purchaseOrderId: 'demo-po-03',
                direction: 'receivable',
                mitraId: null,
                kind: 'settlement',
                invoiceDate: '2026-09-28',
                terms: [{ label: 'Payment test', amount: '1700000.00', dueDate: '2026-09-01' }],
                notes: null,
            },
            key: 'invoice',
        },
        generation,
        signal,
    )
    const invoice = await invoices.mutate(
        maker,
        {
            action: 'issue',
            id: draft.id,
            input: { version: draft.version, revisionNumber: 1 },
            key: 'issue',
        },
        generation,
        signal,
    )
    const proof = await documents.upload(
        owner,
        {
            parentType: 'payment',
            parentId: null,
            purpose: 'payment_proof',
            file: new File(['%PDF-1.4\nSynthetic proof\n%%EOF'], 'payment-proof.pdf', {
                type: 'application/pdf',
            }),
        },
        'proof',
        generation,
        signal,
    )
    const input = {
        invoiceId: invoice.id,
        paymentDate: '2026-09-28',
        sourceAccountId: 'demo-bank-account-02',
        destinationAccountId: 'demo-bank-account-01',
        cashAmount: '950000.00',
        withholdingAmount: '50000.00',
        roundingAdjustment: '0.00',
        proofDocumentId: proof.id,
        notes: null,
    }
    return { ...context, owner, other, invoices, payments, documents, invoice, proof, input }
}
