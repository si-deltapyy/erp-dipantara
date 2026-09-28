import type { ProductionRow, GraderDashboard } from '@/core/types/production'
import { productionCategories } from '@/core/types/production'
import {
    parseObject,
    parseId,
    parseString,
    parseInteger,
    requireKeys,
    invalidContract,
} from './contracts/value-parsers'
export function parseProductionPeriod(value: unknown): string {
    const period = parseString(value, 'period')
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(period)) return invalidContract('period')
    return period
}
export function parseProductionRow(value: unknown): ProductionRow {
    const row = parseObject(value, 'production')
    requireKeys(
        row,
        ['period', 'timberProductId', 'timberProductName', 'category', 'quantity', 'volumeM3'],
        'production',
    )
    const category = productionCategories.find((candidate) => candidate === row.category)
    if (!category) return invalidContract('category')
    const volumeM3 = parseString(row.volumeM3, 'volumeM3')
    if (!/^\d+\.\d{6}$/.test(volumeM3)) return invalidContract('volumeM3')
    return {
        period: parseProductionPeriod(row.period),
        timberProductId: parseId(row.timberProductId),
        timberProductName: parseString(row.timberProductName, 'timberProductName'),
        category,
        quantity: parseInteger(row.quantity, 'quantity', 0),
        volumeM3,
    }
}
export function parseGraderDashboard(value: unknown): GraderDashboard | null {
    if (value === null) return null
    const snapshot = parseObject(value, 'grader')
    requireKeys(snapshot, ['period', 'assignments', 'production'], 'grader')
    const period = parseProductionPeriod(snapshot.period)
    const counts = parseObject(snapshot.assignments, 'assignments')
    requireKeys(
        counts,
        ['count', 'assignedQuantity', 'approvedQuantity', 'remainingQuantity', 'targetPath'],
        'assignments',
    )
    if (counts.targetPath !== '/assignments' || !Array.isArray(snapshot.production))
        return invalidContract('grader')
    const production = snapshot.production.map(parseProductionRow)
    if (production.some((row) => row.period !== period)) return invalidContract('period')
    if (
        new Set(production.map((row) => `${row.timberProductId}:${row.category}`)).size !==
        production.length
    )
        return invalidContract('production')
    const assignedQuantity = parseInteger(counts.assignedQuantity, 'assignedQuantity', 0)
    const approvedQuantity = parseInteger(counts.approvedQuantity, 'approvedQuantity', 0)
    const remainingQuantity = parseInteger(counts.remainingQuantity, 'remainingQuantity', 0)
    if (approvedQuantity + remainingQuantity !== assignedQuantity)
        return invalidContract('assignments')
    return {
        period,
        production,
        assignments: {
            count: parseInteger(counts.count, 'count', 0),
            assignedQuantity,
            approvedQuantity,
            remainingQuantity,
            targetPath: '/assignments',
        },
    }
}
