import { createApprovedGradingScenario } from './grading-scenario'
import { ReportRepository } from '../../resources/js/src/api/mocks/persistence/report-repository'
export async function exercisePurchasePriceReport(): Promise<
    Awaited<ReturnType<typeof buildReport>>
> {
    return buildReport()
}
async function buildReport() {
    const context = await createApprovedGradingScenario('woodflow-demo')
    const reports = new ReportRepository(context.options)
    const query = {
        page: 1,
        perPage: 20,
        search: '',
        sort: '-createdAt' as const,
        period: '2026-09',
    }
    const result = await reports.purchasePrices(context.admin, query, context.signal)
    const denied = await reports
        .purchasePrices(
            {
                ...context.admin,
                permissions: context.admin.permissions.filter(
                    (permission) => permission !== 'timber-prices.read.all',
                ),
            },
            query,
            context.signal,
        )
        .catch((cause: { kind: string }) => cause.kind)
    const reportDenied = await reports
        .purchasePrices(
            {
                ...context.admin,
                permissions: context.admin.permissions.filter(
                    (permission) => permission !== 'reports.read.all',
                ),
            },
            query,
            context.signal,
        )
        .catch((cause: { kind: string }) => cause.kind)
    return { result, denied, reportDenied }
}
