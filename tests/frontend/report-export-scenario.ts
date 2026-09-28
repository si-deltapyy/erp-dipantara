import { createApprovedGradingScenario } from './grading-scenario'
import { ReportRepository } from '../../resources/js/src/api/mocks/persistence/report-repository'
import { ReportExportRepository } from '../../resources/js/src/api/mocks/persistence/report-export-repository'
import { DocumentRepository } from '../../resources/js/src/api/mocks/persistence/document-repository'
import { DemoRepository } from '../../resources/js/src/api/mocks/persistence/demo-repository'
import { runDemoTransaction } from '../../resources/js/src/api/mocks/persistence/transaction'
import { DemoRuntime } from '../../resources/js/src/api/mocks/demo-runtime'
import { createMockReports } from '../../resources/js/src/api/adapters/reports-mock'
import type { ReportExportInput } from '../../resources/js/src/core/types/report-export'
type Context = Awaited<ReturnType<typeof createApprovedGradingScenario>>
async function expandProjectionFixture(context: Context): Promise<void> {
    const original = context.approved.rows[0]
    if (!original) throw new Error('Missing grading row')
    const rows = Array.from({ length: 26 }, (_, index) => ({
        ...original,
        rowId: 'export-row-' + index,
        timberProductId: 'export-wood-' + index,
        quantity: 1,
    }))
    await runDemoTransaction(context.options, ['gradings'], 'readwrite', async (transaction) => {
        await transaction.put('gradings', {
            ...context.approved,
            rows,
            totalVolumeM3: '2.600000',
            rowResults: rows.map((row, index) => ({
                rowId: row.rowId,
                volumeM3: '0.100000',
                timberProductName: index === 0 ? '=SUM(1,2)' : 'Wood ' + index,
            })),
        })
    })
}
export async function exerciseReportExport(): Promise<Awaited<ReturnType<typeof buildExport>>> {
    return buildExport()
}
async function buildExport() {
    await new DemoRepository({ name: 'woodflow-demo' }).initialize()
    await runDemoTransaction(
        { name: 'woodflow-demo' },
        ['purchase-orders'],
        'readwrite',
        async (transaction) => {
            const purchaseOrder = await transaction.get('purchase-orders', 'demo-po-03')
            if (!purchaseOrder) throw new Error('Missing purchase order')
            await transaction.put('purchase-orders', {
                ...purchaseOrder,
                lines: purchaseOrder.lines.map((line) => ({ ...line, quantity: 26 })),
                totalAmount: '3900000.00',
            })
        },
    )
    const context = await createApprovedGradingScenario('woodflow-demo', 'demo-po-03', 26)
    await expandProjectionFixture(context)
    const reports = new ReportRepository(context.options)
    const exports = new ReportExportRepository(context.options)
    const documents = new DocumentRepository(context.options)
    const runtime = new DemoRuntime(new DemoRepository(context.options))
    const api = createMockReports(runtime, () => context.admin, reports, exports)
    const input: ReportExportInput = {
        kind: 'production',
        period: '2026-09',
        format: 'csv',
        filters: {},
    }
    try {
        const page = await reports.production(
            context.admin,
            { page: 1, perPage: 20, search: '', sort: '-createdAt', period: input.period },
            context.signal,
        )
        runtime.configure(context.admin, 'update', { scenario: 'committed-timeout', latency: 0 })
        const timeout = await api
            .export(input, { signal: context.signal, idempotencyKey: 'retry-export' })
            .catch((cause: { kind: string }) => cause.kind)
        const countAfterTimeout = await runDemoTransaction(
            context.options,
            ['reportExports'],
            'readonly',
            (transaction) => transaction.count('reportExports'),
        )
        runtime.configure(context.admin, 'update', { scenario: 'success', latency: 0 })
        const saved = await api.export(input, {
            signal: context.signal,
            idempotencyKey: 'retry-export',
        })
        const repeated = await api.export(input, {
            signal: context.signal,
            idempotencyKey: 'retry-export',
        })
        const countAfterRetry = await runDemoTransaction(
            context.options,
            ['reportExports'],
            'readonly',
            (transaction) => transaction.count('reportExports'),
        )
        const content = await documents.download(context.admin, saved.id, context.signal)
        const csv = await content.blob.text()
        const foreign = await documents
            .download(context.supervisor, saved.id, context.signal)
            .catch((cause: { kind: string }) => cause.kind)
        const revoked = await documents
            .download(
                {
                    ...context.admin,
                    permissions: context.admin.permissions.filter(
                        (permission) => !permission.startsWith('reports.read.'),
                    ),
                },
                saved.id,
                context.signal,
            )
            .catch((cause: { kind: string }) => cause.kind)
        const price = await api.export(
            { ...input, kind: 'purchase_prices' },
            { signal: context.signal, idempotencyKey: 'price-export' },
        )
        const priceDenied = await documents
            .download(
                {
                    ...context.admin,
                    permissions: context.admin.permissions.filter(
                        (permission) => permission !== 'timber-prices.read.all',
                    ),
                },
                price.id,
                context.signal,
            )
            .catch((cause: { kind: string }) => cause.kind)
        const conflict = await api
            .export(
                { ...input, period: '2026-08' },
                { signal: context.signal, idempotencyKey: 'retry-export' },
            )
            .catch((cause: { kind: string }) => cause.kind)
        const empty = await api.export(
            { ...input, period: '2026-08' },
            { signal: context.signal, idempotencyKey: 'empty-export' },
        )
        const emptyCsv = await (
            await documents.download(context.admin, empty.id, context.signal)
        ).blob.text()
        const assigned = await exports.create(
            context.grader,
            input,
            'assigned-export',
            context.generation,
            context.signal,
        )
        const assignedCsv = await (
            await documents.download(context.grader, assigned.id, context.signal)
        ).blob.text()
        return {
            pageTotal: page.meta.total,
            pageLength: page.data.length,
            timeout,
            countAfterTimeout,
            countAfterRetry,
            same: saved.id === repeated.id,
            csv,
            foreign,
            revoked,
            priceDenied,
            conflict,
            emptyCsv,
            assignedCsv,
        }
    } finally {
        runtime.dispose()
    }
}
