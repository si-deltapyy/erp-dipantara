import type { DashboardActivity } from '@/core/types/dashboard-activity'
import { activityStatuses } from '@/core/types/dashboard-activity'
import { parseTimestamp } from './contracts/timestamp-parser'
import {
    invalidContract,
    parseObject,
    parseString,
    parseId,
    requireKeys,
} from './contracts/value-parsers'
export function parseDashboardActivity(value: unknown): DashboardActivity {
    const record = parseObject(value, 'activity')
    requireKeys(
        record,
        ['resource', 'id', 'purchaseOrderNumber', 'label', 'status', 'updatedAt', 'targetPath'],
        'activity',
    )
    const resource = record.resource
    if (resource !== 'purchase-orders' && resource !== 'invoices' && resource !== 'payments')
        return invalidContract('resource')
    const id = parseId(record.id)
    const status = parseString(record.status, 'status')
    if (!(activityStatuses[resource] as readonly string[]).includes(status))
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
        updatedAt: parseTimestamp(record.updatedAt, 'updatedAt'),
    }
}
export function parseActivityList(value: unknown): readonly DashboardActivity[] {
    if (!Array.isArray(value) || value.length > 10) return invalidContract('activity')
    const activity = value.map(parseDashboardActivity)
    if (
        new Set(activity.map((record) => `${record.resource}:${record.id}`)).size !==
        activity.length
    )
        return invalidContract('activity')
    return activity
}
