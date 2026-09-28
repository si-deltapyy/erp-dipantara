import { parseId } from '../../resources/js/src/api/contracts/value-parsers'
import { createRequestedClosing } from './closing-review-scenario'
import { DashboardRepository } from '../../resources/js/src/api/mocks/persistence/dashboard-repository'
import { runDemoTransaction } from '../../resources/js/src/api/mocks/persistence/transaction'
import { reviewQueueKinds } from '../../resources/js/src/core/types/dashboard-queue'

export async function exerciseReviewDashboard(): Promise<
    Awaited<ReturnType<typeof reviewScenario>>
> {
    return reviewScenario()
}

async function reviewScenario() {
    const { context, closing } = await createRequestedClosing()
    const { options, signal, supervisor, admin } = context
    const dashboard = new DashboardRepository(options)
    await runDemoTransaction(
        options,
        ['purchase-orders', 'orders', 'assignments', 'gradings', 'payments'],
        'readwrite',
        async (tx) => {
            const order = (await tx.list('orders'))[0]
            const payment = (await tx.list('payments'))[0]
            if (!order || !payment) throw new Error('Missing review source')
            for (let index = 0; index < 23; index++)
                await tx.put('purchase-orders', {
                    ...context.po,
                    id: 'review-po-' + index,
                    number: 'REVIEW-' + index,
                    status: 'submitted',
                    version: index + 1,
                    createdByUserId: parseId(index === 21 ? supervisor.id : context.owner.id),
                    submittedByUserId: parseId(index === 22 ? supervisor.id : context.owner.id),
                })
            await tx.put('orders', {
                ...order,
                id: 'review-order',
                purchaseOrderId: 'demo-po-03',
                status: 'submitted',
                createdByUserId: parseId(context.maker.id),
                submittedByUserId: parseId(context.maker.id),
            })
            await tx.put('assignments', {
                ...context.assignment,
                id: 'review-assignment',
                orderId: 'review-order',
            })
            await tx.put('gradings', {
                ...context.approved,
                id: 'review-grading',
                assignmentId: 'review-assignment',
                status: 'submitted',
            })
            await tx.put('payments', {
                ...payment,
                id: 'review-payment',
                purchaseOrderId: 'demo-po-03',
                status: 'submitted',
                createdByUserId: parseId(context.owner.id),
                submittedByUserId: parseId(context.owner.id),
            })
        },
    )
    const before = await dashboard.get(supervisor, signal)
    const query = {
        kind: 'purchase-orders-review' as const,
        page: 1,
        perPage: 1,
        search: 'REVIEW-',
        sort: 'createdAt' as const,
    }
    const first = await dashboard.queue(supervisor, query, signal)
    const second = await dashboard.queue(supervisor, { ...query, page: 2 }, signal)
    const pages = await Promise.all(
        reviewQueueKinds.map((kind) =>
            dashboard.queue(supervisor, { ...query, kind, search: '', perPage: 100 }, signal),
        ),
    )
    const self = await dashboard.queue(
        admin,
        { ...query, kind: 'closings-review', search: '' },
        signal,
    )
    const readOnly = {
        ...supervisor,
        permissions: supervisor.permissions.filter(
            (permission) => !permission.includes('.approve.') && !permission.includes('.reject.'),
        ),
    }
    const limited = await dashboard.get(readOnly, signal)
    let denied = ''
    try {
        await dashboard.queue(readOnly, query, signal)
    } catch (cause) {
        denied = (cause as { kind: string }).kind
    }
    await runDemoTransaction(options, ['purchase-orders'], 'readwrite', async (tx) => {
        const parent = await tx.get('purchase-orders', 'demo-po-03')
        if (!parent) throw new Error('Missing parent')
        await tx.put('purchase-orders', { ...parent, status: 'closed' })
    })
    const closed = await dashboard.get(supervisor, signal)
    return { before, first, second, pages, self, limited, denied, closed, closingId: closing.id }
}
