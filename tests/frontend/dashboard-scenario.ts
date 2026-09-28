import {
    createSettlementScenario,
    issueSettlementInvoice,
    submitSettlementPayment,
} from './settlement-scenario'
import { DashboardRepository } from '../../resources/js/src/api/mocks/persistence/dashboard-repository'
import { PurchaseOrderRepository } from '../../resources/js/src/api/mocks/persistence/purchase-order-repository'
import { DeliveryRepository } from '../../resources/js/src/api/mocks/persistence/delivery-repository'
import { DemoRepository } from '../../resources/js/src/api/mocks/persistence/demo-repository'
import { runDemoTransaction } from '../../resources/js/src/api/mocks/persistence/transaction'
import { sumMoney } from '../../resources/js/src/core/domain/money-arithmetic'
export async function exerciseDashboard(): Promise<Awaited<ReturnType<typeof buildDashboard>>> {
    return buildDashboard()
}
async function buildDashboard() {
    await initializeDashboardDataset('woodflow-demo')
    const context = await createSettlementScenario('woodflow-demo')
    const { admin, owner, supervisor, maker, signal, invoices, generation } = context
    const repository = new DashboardRepository({ name: 'woodflow-demo' })
    const receivable = await issueSettlementInvoice(
        context,
        'receivable',
        'settlement',
        '1700000.00',
    )
    await issueSettlementInvoice(context, 'payable', 'settlement', '800000.00')
    const pending = await submitSettlementPayment(context, receivable, '700000.00')
    const before = await repository.get(admin, signal)
    await context.payments.mutate(
        supervisor,
        {
            action: 'approve',
            id: pending.id,
            input: { version: pending.version },
            key: 'dashboard-credit',
        },
        generation,
        signal,
    )
    const revision = await invoices.mutate(
        maker,
        {
            action: 'revise',
            id: receivable.id,
            input: {
                version: receivable.version,
                reason: 'Dashboard active issued proof',
                terms: [{ label: 'Revised later', amount: '1900000.00', dueDate: null }],
            },
            key: 'dashboard-revision',
        },
        generation,
        signal,
    )
    const query = { page: 1, perPage: 1, search: '', sort: '-createdAt' as const }
    const filtered = await invoices.list(
        admin,
        { ...query, balance: 'outstanding', direction: 'receivable' },
        signal,
    )
    const otherOwner = { ...owner, id: 'other-owner' }
    const purchaseOrders = new PurchaseOrderRepository({ name: 'woodflow-demo' })
    for (let index = 0; index < 21; index++) {
        const created = await purchaseOrders.mutate(
            otherOwner,
            {
                action: 'create',
                input: {
                    buyerId: 'demo-buyer-01',
                    number: `DASHBOARD-${index}`,
                    orderDate: '2026-09-28',
                    notes: null,
                    lines: [
                        { timberProductId: 'demo-timber-01', quantity: 1, unitPrice: '100.00' },
                    ],
                },
                key: `dashboard-po-${index}`,
            },
            generation,
            signal,
        )
        const submitted = await purchaseOrders.mutate(
            otherOwner,
            {
                action: 'submit',
                id: created.id,
                input: { version: created.version },
                key: `dashboard-submit-${index}`,
            },
            generation,
            signal,
        )
        await purchaseOrders.mutate(
            supervisor,
            {
                action: 'approve',
                id: submitted.id,
                input: { version: submitted.version },
                key: `dashboard-approve-${index}`,
            },
            generation,
            signal,
        )
    }
    const after = await repository.get(admin, signal)
    const ownerView = await repository.get(owner, signal)
    const poPage = await purchaseOrders.list(admin, { ...query, status: 'approved' }, signal)
    const deliveries = new DeliveryRepository({ name: 'woodflow-demo' })
    const deliveryPage = await deliveries.list(admin, { ...query, status: 'dispatched' }, signal)
    const assigned = await repository.get(context.grader, signal)
    const narrowed = await repository.get(
        { ...admin, permissions: ['dashboard.read.own', 'purchase-orders.read.all'] },
        signal,
    )
    const forbidden = await repository
        .get({ ...admin, permissions: [] }, signal)
        .catch((cause: { kind: string }) => cause.kind)
    const emptyOptions = { name: 'dashboard-empty-' + crypto.randomUUID() }
    await initializeDashboardDataset(emptyOptions.name)
    const empty = await new DashboardRepository(emptyOptions).get(admin, signal)
    return {
        before,
        after,
        ownerView,
        assigned,
        narrowed,
        forbidden,
        empty,
        poTotal: poPage.meta.total,
        deliveryTotal: deliveryPage.meta.total,
        filtered,
        outstanding: sumMoney(filtered.data.map((invoice) => invoice.outstandingAmount)),
        revisionId: revision.id,
    }
}
async function initializeDashboardDataset(name: string): Promise<void> {
    await new DemoRepository({ name }).initialize()
    await runDemoTransaction(
        { name },
        ['purchase-orders', 'invoices'],
        'readwrite',
        async (transaction) => {
            await transaction.clear('purchase-orders')
            await transaction.clear('invoices')
        },
    )
}
