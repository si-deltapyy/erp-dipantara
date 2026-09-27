import { expect, test } from 'vitest'
import { previewGradingVolume, sumGradingVolumes } from './grading-volume'
import { gradingFixture } from '../../../../../tests/frontend/grading-fixture'
import { parseGradingInput } from '@/api/grading-mapper'
test('rounds once per row including quantity and sums rounded row volumes exactly', () => {
    const results = previewGradingVolume(gradingFixture.rows)
    expect(results).toEqual([{ rowId: 'row-one', volumeM3: '0.196350' }])
    expect(sumGradingVolumes([...results, ...results])).toBe('0.392700')
    const row = gradingFixture.rows[0]!
    expect(
        previewGradingVolume([{ ...row, diameterCm: '1', lengthM: '1', quantity: 3 }])[0]?.volumeM3,
    ).toBe('0.000236')
})
test('rejects invalid dates, duplicate row IDs, nonpositive quantities and excess precision', () => {
    const input = {
        assignmentId: gradingFixture.assignmentId,
        gradingDate: gradingFixture.gradingDate,
        rows: gradingFixture.rows,
    }
    for (const patch of [
        { gradingDate: '2026-02-30' },
        { rows: [...input.rows, ...input.rows] },
        { rows: [{ ...input.rows[0], quantity: 0 }] },
        { rows: [{ ...input.rows[0], diameterCm: '1.234' }] },
    ])
        expect(() => parseGradingInput({ ...input, ...patch })).toThrow()
})
