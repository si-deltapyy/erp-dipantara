import { createApprovedGradingScenario } from './grading-scenario'
import { ReportRepository } from '../../resources/js/src/api/mocks/persistence/report-repository'
export async function exerciseProductionReport(): Promise<Awaited<ReturnType<typeof buildReport>>> {
    return buildReport()
}
async function buildReport() {
    const first = await createApprovedGradingScenario('woodflow-demo', 'demo-po-03', 2, 1)
    await createApprovedGradingScenario('woodflow-demo', 'demo-po-08', 2, 2)
    const reports = new ReportRepository(first.options)
    const query = {
        page: 1,
        perPage: 20,
        search: '',
        sort: '-createdAt' as const,
        period: '2026-09',
    }
    const all = await reports.production(first.admin, query, first.signal)
    const own = await reports.production(first.grader, query, first.signal)
    const foreign = await reports.production(
        first.grader,
        { ...query, graderId: 'demo-grader-02' },
        first.signal,
    )
    const empty = await reports.production(
        first.admin,
        { ...query, period: '2026-08' },
        first.signal,
    )
    const denied = await reports
        .production({ ...first.admin, permissions: [] }, query, first.signal)
        .catch((cause: { kind: string }) => cause.kind)
    return { all, own, foreign, empty, denied }
}
