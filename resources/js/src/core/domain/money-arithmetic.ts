export function moneyUnits(amount: string): bigint {
    if (!/^-?\d+\.\d{2}$/.test(amount)) throw new Error('Invalid monetary amount')
    return BigInt(amount.replace('.', ''))
}
export function moneyAmount(units: bigint): string {
    const absolute = units < 0n ? -units : units
    return `${units < 0n ? '-' : ''}${absolute / 100n}.${String(absolute % 100n).padStart(2, '0')}`
}
export function sumMoney(amounts: readonly string[]): string {
    return moneyAmount(amounts.reduce((total, amount) => total + moneyUnits(amount), 0n))
}
