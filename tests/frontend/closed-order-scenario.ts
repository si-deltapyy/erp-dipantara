import { createRequestedClosing } from './closing-review-scenario'
import { ClosingRepository } from '../../resources/js/src/api/mocks/persistence/closing-repository'
import { PurchaseOrderRepository } from '../../resources/js/src/api/mocks/persistence/purchase-order-repository'
import { DeliveryRepository } from '../../resources/js/src/api/mocks/persistence/delivery-repository'
import { DemoRepository } from '../../resources/js/src/api/mocks/persistence/demo-repository'
import { runDemoTransaction } from '../../resources/js/src/api/mocks/persistence/transaction'
import { operationalClosedWrites } from './closed-operational-writes'
import { financialClosedWrites } from './closed-financial-writes'
import { sessionFixtures } from '../../resources/js/src/api/mocks/session-fixtures'
export async function prepareClosedOrder(): Promise<
    Awaited<ReturnType<typeof prepareLockScenario>>
> {
    return prepareLockScenario()
}
async function prepareLockScenario() {
    const setup = await createRequestedClosing()
    const { context } = setup
    const query = {
        page: 1,
        perPage: 20,
        search: '',
        sort: '-createdAt' as const,
        purchaseOrderId: context.po.id,
    }
    const invoice = (await context.invoices.list(context.admin, query, context.signal)).data[0]
    const payment = (await context.payments.list(context.admin, query, context.signal)).data[0]
    if (!invoice || !payment) throw new Error('Missing settlement records')
    return { ...setup, invoice, payment }
}
export async function approveClosingFromAnotherTab(id: string): Promise<void> {
    const { generation } = await new DemoRepository().initialize()
    const actor = sessionFixtures.find((user) => user.id === 'supervisor-demo')
    if (!actor) throw new Error('Missing supervisor')
    const api = new ClosingRepository()
    const signal = new AbortController().signal
    const closing = await api.get(actor, id, signal)
    await api.review(
        actor,
        { id, action: 'approve', input: { version: closing.version }, key: 'other-tab-close' },
        generation,
        signal,
    )
}
export async function exerciseClosedOrderLock(): Promise<
    Awaited<ReturnType<typeof runLockScenario>>
> {
    return runLockScenario()
}
async function runLockScenario() {
    const setup = await prepareClosedOrder()
    const { context, closings, closing, invoice, payment } = setup
    const {
        po,
        admin,
        owner,
        maker,
        grader,
        supervisor,
        signal,
        generation,
        assignment,
        approved,
        shipments,
        options,
    } = context
    await closings.review(
        supervisor,
        { id: closing.id, action: 'approve', input: { version: closing.version }, key: 'close' },
        generation,
        signal,
    )
    const purchaseOrders = new PurchaseOrderRepository(options)
    const deliveries = new DeliveryRepository(options)
    const shipment = shipments[0]
    if (!shipment) throw new Error('Missing shipment')
    const version = { version: 1 }
    const writes = [...operationalClosedWrites(setup), ...financialClosedWrites(setup)]
    for (const action of ['submit', 'approve', 'reject'] as const) {
        const input = action === 'reject' ? { ...version, reason: 'Late rejection' } : version
        writes.push([
            `po-${action}`,
            () =>
                purchaseOrders.mutate(
                    action === 'submit' ? owner : supervisor,
                    { action, id: po.id, input, key: `closed-po-${action}` },
                    generation,
                    signal,
                ),
        ])
        writes.push([
            `order-${action}`,
            () =>
                context.orders.mutate(
                    action === 'submit' ? maker : supervisor,
                    { action, id: context.order.id, input, key: `closed-order-${action}` },
                    generation,
                    signal,
                ),
        ])
        writes.push([
            `grading-${action}`,
            () =>
                context.gradings.mutate(
                    action === 'submit' ? grader : supervisor,
                    { action, id: approved.id, input, key: `closed-grading-${action}` },
                    generation,
                    signal,
                ),
        ])
        writes.push([
            `payment-${action}`,
            () =>
                context.payments.mutate(
                    action === 'submit' ? owner : supervisor,
                    { action, id: payment.id, input, key: `closed-payment-${action}` },
                    generation,
                    signal,
                ),
        ])
    }
    for (const action of ['dispatch', 'receive'] as const)
        writes.push([
            `delivery-${action}`,
            () =>
                deliveries.mutate(
                    admin,
                    { action, id: shipment.id, input: version, key: `closed-${action}` },
                    generation,
                    signal,
                ),
        ])
    const auditBefore = await runDemoTransaction(options, ['audit'], 'readonly', (tx) =>
        tx.count('audit'),
    )
    const outcomes: { name: string; kind: string }[] = []
    for (const [name, write] of writes) {
        try {
            await write()
            outcomes.push({ name, kind: 'unexpected-success' })
        } catch (cause) {
            outcomes.push({ name, kind: (cause as { kind: string }).kind })
        }
    }
    const auditAfter = await runDemoTransaction(options, ['audit'], 'readonly', (tx) =>
        tx.count('audit'),
    )
    const historicalInvoice = await context.invoices.get(owner, invoice.id, signal)
    if (!historicalInvoice.documentId) throw new Error('Missing invoice document')
    const document = await context.documents.download(owner, historicalInvoice.documentId, signal)
    return {
        outcomes,
        auditBefore,
        auditAfter,
        documentSize: document.blob.size,
        po: await purchaseOrders.get(owner, po.id, signal),
        invoice: historicalInvoice,
        grading: await context.gradings.get(grader, approved.id, signal),
        assignment: await context.assignments.get(grader, assignment.id, signal),
        payment: await context.payments.get(owner, payment.id, signal),
        shipment: await deliveries.get(owner, shipment.id, signal),
    }
}
