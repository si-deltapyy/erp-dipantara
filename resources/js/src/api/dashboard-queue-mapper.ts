import type {
    DashboardQueueEntry,
    DashboardQueueKind,
    DashboardQueueQuery,
    DashboardQueueSummary,
} from '@/core/types/dashboard-queue'
import { dashboardQueueKinds, queueStatuses, queueResources } from '@/core/types/dashboard-queue'
import { parseBuyerQuery } from './buyer-mapper'
import { parseTimestamp } from './contracts/timestamp-parser'
import { parsePage } from './contracts/response-parsers'
import type { PageResponse } from '@/core/types/contracts'
import {
    parseObject,
    parseString,
    parseId,
    parseInteger,
    requireKeys,
    invalidContract,
} from './contracts/value-parsers'
export function parseQueueKind(value: unknown): DashboardQueueKind {
    const kind = parseString(value, 'kind')
    const matched = dashboardQueueKinds.find((candidate) => candidate === kind)
    if (!matched) return invalidContract('kind')
    return matched
}
export function parseQueueQuery(query: DashboardQueueQuery): DashboardQueueQuery {
    return { ...parseBuyerQuery(query), kind: parseQueueKind(query.kind) }
}
export function parseQueueEntry(value: unknown): DashboardQueueEntry {
    const record = parseObject(value, 'queueEntry')
    requireKeys(
        record,
        [
            'resource',
            'id',
            'label',
            'purchaseOrderNumber',
            'status',
            'version',
            'updatedAt',
            'createdAt',
            'targetPath',
        ],
        'queueEntry',
    )
    const resource = record.resource
    if (
        resource !== 'purchase-orders' &&
        resource !== 'orders' &&
        resource !== 'deliveries' &&
        resource !== 'invoices' &&
        resource !== 'payments' &&
        resource !== 'gradings' &&
        resource !== 'closings'
    )
        return invalidContract('resource')
    const id = parseId(record.id)
    const status = parseString(record.status, 'status')
    if (!(queueStatuses[resource] as readonly string[]).includes(status))
        return invalidContract('status')
    const targetPath = `/${resource}/${encodeURIComponent(id)}`
    if (record.targetPath !== targetPath) return invalidContract('targetPath')
    return {
        resource,
        id,
        status,
        targetPath,
        label: parseString(record.label, 'label'),
        purchaseOrderNumber: parseString(record.purchaseOrderNumber, 'purchaseOrderNumber'),
        version: parseInteger(record.version, 'version'),
        updatedAt: parseTimestamp(record.updatedAt, 'updatedAt'),
        createdAt: parseTimestamp(record.createdAt, 'createdAt'),
    }
}
export function parseQueuePage(
    value: unknown,
    kind: DashboardQueueKind,
): PageResponse<DashboardQueueEntry> {
    const page = parsePage(value, parseQueueEntry)
    if (page.data.some((record) => record.resource !== queueResources[kind]))
        return invalidContract('resource')
    return page
}
export function parseQueueSummaries(value: unknown): readonly DashboardQueueSummary[] {
    if (!Array.isArray(value)) return invalidContract('queues')
    const queues = value.map((entry): DashboardQueueSummary => {
        const record = parseObject(entry, 'queue')
        requireKeys(record, ['kind', 'count', 'targetPath'], 'queue')
        const kind = parseQueueKind(record.kind)
        const targetPath = '/dashboard/queue?kind=' + kind
        if (record.targetPath !== targetPath) return invalidContract('targetPath')
        return { kind, count: parseInteger(record.count, 'count', 0), targetPath }
    })
    if (new Set(queues.map((queue) => queue.kind)).size !== queues.length)
        return invalidContract('queues')
    return queues
}
