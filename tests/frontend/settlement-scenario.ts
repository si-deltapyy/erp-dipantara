import { createApprovedGradingScenario } from './grading-scenario'
import { receiveSettlementAllocation } from './settlement-delivery-scenario'
import { DemoRepository } from '../../resources/js/src/api/mocks/persistence/demo-repository'
import { PurchaseOrderRepository } from '../../resources/js/src/api/mocks/persistence/purchase-order-repository'
import { InvoiceRepository } from '../../resources/js/src/api/mocks/persistence/invoice-repository'
import { PaymentRepository } from '../../resources/js/src/api/mocks/persistence/payment-repository'
import { DocumentRepository } from '../../resources/js/src/api/mocks/persistence/document-repository'
import { sessionFixtures } from '../../resources/js/src/api/mocks/session-fixtures'
import type { Invoice } from '../../resources/js/src/core/types/invoice'
import type { Payment } from '../../resources/js/src/core/types/payment'
export async function createSettlementScenario(
    name?: string,
): Promise<Awaited<ReturnType<typeof buildSettlementScenario>>> {
    return buildSettlementScenario(name)
}
async function buildSettlementScenario(name?: string) {
    const options = { name: name ?? 'settlement-chain-' + crypto.randomUUID() }
    const { generation } = await new DemoRepository(options).initialize()
    const owner = sessionFixtures.find((actor) => actor.id === 'user-demo')
    const supervisor = sessionFixtures.find((actor) => actor.id === 'supervisor-demo')
    if (!owner || !supervisor) throw new Error('Missing actors')
    const signal = new AbortController().signal
    const purchaseOrders = new PurchaseOrderRepository(options)
    const po = await purchaseOrders.mutate(
        owner,
        {
            action: 'create',
            input: {
                buyerId: 'demo-buyer-01',
                number: 'CHAIN-' + crypto.randomUUID(),
                orderDate: '2026-09-28',
                notes: null,
                lines: [{ timberProductId: 'demo-timber-01', quantity: 500, unitPrice: '3400.00' }],
            },
            key: 'po',
        },
        generation,
        signal,
    )
    const submitted = await purchaseOrders.mutate(
        owner,
        { action: 'submit', id: po.id, input: { version: po.version }, key: 'submit-po' },
        generation,
        signal,
    )
    const approvedPo = await purchaseOrders.mutate(
        supervisor,
        { action: 'approve', id: po.id, input: { version: submitted.version }, key: 'approve-po' },
        generation,
        signal,
    )
    const context = await createApprovedGradingScenario(options.name, po.id, 500)
    const shipments = []
    for (const quantity of [200, 200, 100])
        shipments.push(await receiveSettlementAllocation(context, po.id, quantity))
    return {
        ...context,
        owner,
        po: approvedPo,
        shipments,
        invoices: new InvoiceRepository(options),
        payments: new PaymentRepository(options),
        documents: new DocumentRepository(options),
    }
}
export async function issueSettlementInvoice(
    context: Awaited<ReturnType<typeof createSettlementScenario>>,
    direction: Invoice['direction'],
    kind: Invoice['kind'],
    amount: string,
): Promise<Invoice> {
    const key = crypto.randomUUID()
    const draft = await context.invoices.mutate(
        context.maker,
        {
            action: 'create',
            input: {
                purchaseOrderId: context.po.id,
                mitraId: direction === 'payable' ? 'demo-mitra-01' : null,
                direction,
                kind,
                invoiceDate: '2026-09-28',
                terms: [{ label: 'Chain invoice', amount, dueDate: '2026-09-01' }],
                notes: null,
            },
            key,
        },
        context.generation,
        context.signal,
    )
    return context.invoices.mutate(
        context.maker,
        {
            action: 'issue',
            id: draft.id,
            input: { version: draft.version, revisionNumber: 1 },
            key,
        },
        context.generation,
        context.signal,
    )
}
export async function submitSettlementPayment(
    context: Awaited<ReturnType<typeof createSettlementScenario>>,
    invoice: Invoice,
    amount: string,
): Promise<Payment> {
    const { owner, generation, signal } = context
    const key = crypto.randomUUID()
    const document = await context.documents.upload(
        owner,
        {
            parentType: 'payment',
            parentId: null,
            purpose: 'payment_proof',
            file: new File(['%PDF-1.4\nSettlement proof\n%%EOF'], 'settlement.pdf', {
                type: 'application/pdf',
            }),
        },
        key,
        generation,
        signal,
    )
    const draft = await context.payments.mutate(
        owner,
        {
            action: 'create',
            input: {
                invoiceId: invoice.id,
                paymentDate: '2026-09-28',
                sourceAccountId:
                    invoice.direction === 'receivable'
                        ? 'demo-bank-account-02'
                        : 'demo-bank-account-01',
                destinationAccountId:
                    invoice.direction === 'receivable'
                        ? 'demo-bank-account-01'
                        : 'demo-bank-account-03',
                cashAmount: amount,
                withholdingAmount: '0.00',
                roundingAdjustment: '0.00',
                proofDocumentId: document.id,
                notes: null,
            },
            key,
        },
        generation,
        signal,
    )
    return context.payments.mutate(
        owner,
        { action: 'submit', id: draft.id, input: { version: draft.version }, key },
        generation,
        signal,
    )
}
