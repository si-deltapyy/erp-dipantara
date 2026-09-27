import type { GradingRow } from '@/core/types/grading'
import { simulateTimberVolume } from './timber-volume'
export function previewGradingVolume(
    rows: readonly GradingRow[],
): readonly { rowId: string; volumeM3: string }[] {
    return rows.flatMap((row) => {
        const volumeM3 = simulateTimberVolume(row.diameterCm, row.lengthM, row.quantity)
        return volumeM3 ? [{ rowId: row.rowId, volumeM3 }] : []
    })
}
export function sumGradingVolumes(results: readonly { volumeM3: string }[]): string {
    const total = results.reduce((sum, row) => sum + BigInt(row.volumeM3.replace('.', '')), 0n)
    return `${total / 1_000_000n}.${String(total % 1_000_000n).padStart(6, '0')}`
}
