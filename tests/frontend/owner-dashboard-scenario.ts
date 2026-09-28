import { exerciseDashboard } from './dashboard-scenario'
import { DashboardRepository } from '../../resources/js/src/api/mocks/persistence/dashboard-repository'
import { sessionFixtures } from '../../resources/js/src/api/mocks/session-fixtures'
export async function exerciseOwnerDashboard(): Promise<
    Awaited<ReturnType<typeof buildOwnerDashboard>>
> {
    return buildOwnerDashboard()
}
async function buildOwnerDashboard() {
    const dashboard = await exerciseDashboard()
    const owner = sessionFixtures.find((actor) => actor.id === 'user-demo')
    if (!owner) throw new Error('Missing owner')
    const repository = new DashboardRepository({ name: 'woodflow-demo' })
    const signal = new AbortController().signal
    const revoked = await repository.get(
        { ...owner, permissions: ['dashboard.read.own', 'purchase-orders.read.own'] },
        signal,
    )
    const other = await repository.get({ ...owner, id: 'other-owner' }, signal)
    return {
        activity: dashboard.ownerView.activity,
        invoiceId: dashboard.revisionId,
        adminActivity: dashboard.after.activity,
        graderActivity: dashboard.assigned.activity,
        revoked,
        other,
    }
}
