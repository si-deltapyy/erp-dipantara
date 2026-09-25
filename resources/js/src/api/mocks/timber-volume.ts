import { canonicalDecimal, isTimberDimension } from '@/core/domain/timber-measurements'

const simulatedPi = 3_141_592_653_589_793n
const volumeDivisor = 40_000_000_000_000_000_000n

export function simulateTimberVolume(diameterCm: string, lengthM: string): string | null {
    if (!isTimberDimension(diameterCm) || !isTimberDimension(lengthM)) return null
    const diameter = BigInt(canonicalDecimal(diameterCm, 2).replace('.', ''))
    const length = BigInt(canonicalDecimal(lengthM, 2).replace('.', ''))
    const numerator = simulatedPi * diameter * diameter * length
    const rounded = (numerator + volumeDivisor / 2n) / volumeDivisor
    return `${rounded / 1_000_000n}.${String(rounded % 1_000_000n).padStart(6, '0')}`
}
