import { createApprovedGradingScenario } from './grading-scenario'
import { DashboardRepository } from '../../resources/js/src/api/mocks/persistence/dashboard-repository'
import type { Grading } from '../../resources/js/src/core/types/grading'
type GradingContext = Awaited<ReturnType<typeof createApprovedGradingScenario>>
async function revise(context: GradingContext, diameters: readonly string[]): Promise<Grading> {
    return context.gradings.mutate(
        context.grader,
        {
            action: 'revise',
            id: context.approved.id,
            input: {
                version: context.approved.version,
                reason: 'Production diameter boundaries',
                gradingDate: '2026-09-27',
                rows: diameters.map((diameterCm, index) => ({
                    rowId: index === 0 ? 'stable-row' : 'boundary-row',
                    timberProductId: 'demo-timber-01',
                    quantity: 2 / diameters.length,
                    diameterCm,
                    lengthM: '2',
                    gradeCode: 'DEMO',
                })),
            },
            key: 'production-revision',
        },
        context.generation,
        context.signal,
    )
}
async function approve(context: GradingContext, draft: Grading): Promise<Grading> {
    const submitted = await context.gradings.mutate(
        context.grader,
        {
            action: 'submit',
            id: draft.id,
            input: { version: draft.version },
            key: 'production-submit',
        },
        context.generation,
        context.signal,
    )
    return context.gradings.mutate(
        context.supervisor,
        {
            action: 'approve',
            id: draft.id,
            input: { version: submitted.version },
            key: 'production-approve',
        },
        context.generation,
        context.signal,
    )
}
export async function exerciseGraderDashboard(): Promise<
    Awaited<ReturnType<typeof buildGraderDashboard>>
> {
    return buildGraderDashboard()
}
async function buildGraderDashboard() {
    const first = await createApprovedGradingScenario('woodflow-demo', 'demo-po-03', 2, 1)
    const second = await createApprovedGradingScenario('woodflow-demo', 'demo-po-08', 2, 2)
    const repository = new DashboardRepository({ name: 'woodflow-demo' })
    const query = { period: '2026-09' }
    const draft = await revise(first, ['20', '30'])
    const pending = await repository.get(first.grader, first.signal, query)
    const approved = await approve(first, draft)
    await approve(second, await revise(second, ['19.99']))
    const own = await repository.get(first.grader, first.signal, query)
    const other = await repository.get(second.grader, second.signal, query)
    const empty = await repository.get(first.grader, first.signal, { period: '2026-08' })
    const invalid = await repository
        .get(first.grader, first.signal, { period: '2026-13' })
        .catch((cause: { kind: string }) => cause.kind)
    const revoked = await repository.get(
        { ...first.grader, permissions: ['dashboard.read.assigned'] },
        first.signal,
        query,
    )
    return { pending, own, other, empty, invalid, revoked, storedRows: approved.rowResults }
}
