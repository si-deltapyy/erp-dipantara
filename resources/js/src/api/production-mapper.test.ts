import { expect, it } from 'vitest'
import {
    parseProductionPeriod,
    parseProductionRow,
    parseGraderDashboard,
} from './production-mapper'
import { productionCategory } from './mocks/persistence/production-projector'
const row = {
    period: '2026-09',
    timberProductId: 'timber-one',
    timberProductName: 'Timber',
    category: 'A2',
    quantity: 2,
    volumeM3: '0.123456',
}
it.each(['2026-00', '2026-13', '2026-1', '2026-01-01', '', '26-09'])(
    'rejects an invalid production period %s',
    (period) => {
        expect(() => parseProductionPeriod(period)).toThrow()
    },
)
it.each([
    ['19.99', 'A1'],
    ['20', 'A2'],
    ['29.99', 'A2'],
    ['30', 'A3'],
])('classifies exact diameter boundaries %s', (diameter, category) => {
    expect(productionCategory(diameter)).toBe(category)
})
it('preserves exact stored volume scale and rejects malformed production rows', () => {
    expect(parseProductionRow(row)).toEqual(row)
    for (const invalid of [
        { ...row, quantity: 0.5 },
        { ...row, volumeM3: '0.12' },
        { ...row, volumeM3: '-0.123456' },
        { ...row, price: '10.00' },
    ])
        expect(() => parseProductionRow(invalid)).toThrow()
})
it('validates assignment reconciliation and forbids finance or cross-period fields', () => {
    const sample = {
        period: '2026-09',
        assignments: {
            count: 1,
            assignedQuantity: 2,
            approvedQuantity: 2,
            remainingQuantity: 0,
            targetPath: '/assignments',
        },
        production: [row],
    }
    expect(parseGraderDashboard(sample)).toEqual(sample)
    expect(parseGraderDashboard(null)).toBeNull()
    expect(() => parseGraderDashboard({ ...sample, finance: {} })).toThrow()
    expect(() =>
        parseGraderDashboard({ ...sample, production: [{ ...row, period: '2026-08' }] }),
    ).toThrow()
    expect(() =>
        parseGraderDashboard({
            ...sample,
            assignments: { ...sample.assignments, remainingQuantity: 1 },
        }),
    ).toThrow()
    expect(() => parseGraderDashboard({ ...sample, production: [row, row] })).toThrow()
})
