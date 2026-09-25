import { ApiError } from '@/core/types/api-error'
import type { DecimalString, MoneyString, OpaqueId } from '@/core/types/contracts'

export function invalidContract(path: string): never {
    throw new ApiError('validation', { [path]: ['contract.invalid'] })
}
export function parseObject(value: unknown, path: string): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return invalidContract(path)
    return value as Record<string, unknown>
}
export function parseString(value: unknown, path: string): string {
    if (typeof value !== 'string') return invalidContract(path)
    return value
}
export function parseInteger(
    value: unknown,
    path: string,
    minimum = 1,
    maximum = Number.MAX_SAFE_INTEGER,
): number {
    if (
        typeof value !== 'number' ||
        !Number.isSafeInteger(value) ||
        value < minimum ||
        value > maximum
    )
        return invalidContract(path)
    return value
}
export function parseId(value: unknown, path = 'id'): OpaqueId {
    const id = parseString(value, path)
    if (!id.length || id.length > 100) return invalidContract(path)
    return id as OpaqueId
}
export function parseDecimal(value: unknown, path = 'amount'): DecimalString {
    const decimal = parseString(value, path)
    if (!/^-?\d+(\.\d{1,6})?$/.test(decimal)) return invalidContract(path)
    return decimal as DecimalString
}
export function parseMoney(value: unknown, path = 'amount'): MoneyString {
    const money = parseString(value, path)
    if (!/^-?\d+\.\d{2}$/.test(money)) return invalidContract(path)
    return money as MoneyString
}
export function parseStrings(value: unknown, path: string): readonly string[] {
    if (!Array.isArray(value)) return invalidContract(path)
    return value.map((entry, index) => parseString(entry, `${path}.${index}`))
}
export function requireKeys(
    record: Record<string, unknown>,
    allowed: readonly string[],
    path: string,
): void {
    if (Object.keys(record).some((key) => !allowed.includes(key))) invalidContract(path)
}
