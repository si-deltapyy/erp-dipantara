import { exerciseDashboard } from './dashboard-scenario'
import { DashboardRepository } from '../../resources/js/src/api/mocks/persistence/dashboard-repository'
import { DemoRepository } from '../../resources/js/src/api/mocks/persistence/demo-repository'
import { OrderRepository } from '../../resources/js/src/api/mocks/persistence/order-repository'
import { runDemoTransaction } from '../../resources/js/src/api/mocks/persistence/transaction'
import { sessionFixtures } from '../../resources/js/src/api/mocks/session-fixtures'
export async function exerciseProcessingDashboard(): Promise<
    Awaited<ReturnType<typeof buildProcessingDashboard>>
> {
    return buildProcessingDashboard()
}
async function buildProcessingDashboard() {
    const initial = await exerciseDashboard()
    const options = { name: 'woodflow-demo' }
    const repository = new DashboardRepository(options)
    const maker = sessionFixtures.find((actor) => actor.id === 'maker-demo')
    const owner = sessionFixtures.find((actor) => actor.id === 'user-demo')
    if (!maker || !owner) throw new Error('Missing dashboard actors')
    const signal = new AbortController().signal
    const query = {
        kind: 'purchase-orders-processing' as const,
        page: 1,
        perPage: 1,
        search: '',
        sort: '-createdAt' as const,
    }
    const before = await repository.get(maker, signal)
    const first = await repository.queue(maker, query, signal)
    const second = await repository.queue(maker, { ...query, page: 2 }, signal)
    const denied = await repository
        .queue(owner, query, signal)
        .catch((cause: { kind: string }) => cause.kind)
    const readOnly = {
        ...maker,
        permissions: ['dashboard.read.all', 'purchase-orders.read.all', 'invoices.read.all'],
    }
    const limited = await repository.get(readOnly, signal)
    const deniedWrite = await repository
        .queue(readOnly, query, signal)
        .catch((cause: { kind: string }) => cause.kind)
    const { generation } = await new DemoRepository(options).initialize()
    const purchaseOrderId = first.data[0]?.id
    if (!purchaseOrderId) throw new Error('Missing unprocessed PO')
    const order = await new OrderRepository(options).mutate(
        maker,
        { action: 'create', input: { purchaseOrderId, notes: null }, key: 'queue-process' },
        generation,
        signal,
    )
    const processed = await repository.get(maker, signal)
    const closedOrder = await runDemoTransaction(
        options,
        ['purchase-orders'],
        'readwrite',
        async (transaction) => {
            const parent = await transaction.get('purchase-orders', purchaseOrderId)
            if (!parent) throw new Error('Missing parent')
            await transaction.put('purchase-orders', { ...parent, status: 'closed' })
            return parent
        },
    )
    const closed = await repository.queue(maker, { ...query, kind: 'orders-processing' }, signal)
    await runDemoTransaction(options, ['purchase-orders'], 'readwrite', (transaction) =>
        transaction.put('purchase-orders', closedOrder),
    )
    const filtered = await repository.queue(
        maker,
        { ...query, search: second.data[0]?.purchaseOrderNumber ?? '' },
        signal,
    )
    return {
        before,
        first,
        second,
        denied,
        deniedWrite,
        limited,
        processed,
        closed,
        filtered,
        orderId: order.id,
        invoiceId: initial.revisionId,
    }
}
