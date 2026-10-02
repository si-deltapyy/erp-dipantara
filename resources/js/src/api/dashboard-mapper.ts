import { parseActivityList } from './dashboard-activity-mapper'
import { parseGraderDashboard, parseProductionPeriod } from './production-mapper'
import type { DashboardQuery } from '@/core/types/dashboard'
import { parseQueueSummaries } from './dashboard-queue-mapper'
import type { DashboardMetric, DashboardSnapshot } from '@/core/types/dashboard'
import { dashboardTargets } from '@/core/types/dashboard'
import { parseTimestamp } from './contracts/timestamp-parser'
import {
    invalidContract,
    parseInteger,
    parseMoney,
    parseObject,
    requireKeys,
} from './contracts/value-parsers'
export function parseDashboardMetric(value: unknown): DashboardMetric {
    const metric = parseObject(value, 'metric')
    requireKeys(metric, ['key', 'value', 'unit', 'targetPath'], 'metric')
    const key = metric.key
    if (key === 'buyer-outstanding' || key === 'mitra-outstanding') {
        if (metric.unit !== 'IDR' || metric.targetPath !== dashboardTargets[key])
            return invalidContract('metric')
        const amount = parseMoney(metric.value, 'value')
        if (amount.startsWith('-')) return invalidContract('value')
        return { key, value: amount, unit: 'IDR', targetPath: dashboardTargets[key] }
    }
    if (
        key !== 'active-purchase-orders' &&
        key !== 'prepared-deliveries' &&
        key !== 'dispatched-deliveries'
    )
        return invalidContract('key')
    if (metric.unit !== 'count' || metric.targetPath !== dashboardTargets[key])
        return invalidContract('metric')
    return {
        key,
        value: parseInteger(metric.value, 'value', 0),
        unit: 'count',
        targetPath: dashboardTargets[key],
    }
}
export function parseDashboardSnapshot(value: unknown): DashboardSnapshot {
    const snapshot = parseObject(value, 'dashboard')
    requireKeys(snapshot, ['asOf', 'metrics', 'activity', 'queues', 'grader'], 'dashboard')
    if (!Array.isArray(snapshot.metrics)) return invalidContract('metrics')
    const metrics = snapshot.metrics.map(parseDashboardMetric)
    if (new Set(metrics.map((metric) => metric.key)).size !== metrics.length)
        return invalidContract('metrics')
    return {
        asOf: parseTimestamp(snapshot.asOf, 'asOf'),
        metrics,
        activity: parseActivityList(snapshot.activity),
        queues: parseQueueSummaries(snapshot.queues),
        grader: parseGraderDashboard(snapshot.grader),
    }
}

export function parseDashboardQuery(query: DashboardQuery): DashboardQuery {
    return query.period === undefined ? {} : { period: parseProductionPeriod(query.period) }
}
