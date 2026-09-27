export function normalizeDecimalInput(value: string): string {
    return value.trim().replace(',', '.')
}
export function isTimberDimension(value: string): boolean {
    return /^\d+(\.\d{1,2})?$/.test(value) && /[1-9]/.test(value)
}
export function isTimberPrice(value: string): boolean {
    return /^\d+\.\d{2}$/.test(value)
}
export function canonicalDecimal(value: string, scale: number): string {
    const [whole = '0', fraction = ''] = value.split('.')
    return `${BigInt(whole)}.${fraction.padEnd(scale, '0')}`
}
export function timberDiameterCategory(diameterCm: string): 'A1' | 'A2' | 'A3' | null {
    if (!isTimberDimension(diameterCm)) return null
    const scaled = BigInt(canonicalDecimal(diameterCm, 2).replace('.', ''))
    return scaled < 2000n ? 'A1' : scaled < 3000n ? 'A2' : 'A3'
}
