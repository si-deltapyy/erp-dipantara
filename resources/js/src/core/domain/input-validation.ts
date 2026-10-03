export const databaseIntegerMaximum = 2147483647

export function isCalendarDate(value: string): boolean {
    return (
        /^\d{4}-\d{2}-\d{2}$/.test(value) &&
        Number(value.slice(0, 4)) > 0 &&
        Number.isFinite(Date.parse(value)) &&
        new Date(value).toISOString().slice(0, 10) === value
    )
}

export function isNonnegativeInteger(value: string, maximum = databaseIntegerMaximum): boolean {
    return /^\d+$/.test(value) && Number.isSafeInteger(Number(value)) && Number(value) <= maximum
}

export function isNonnegativeDecimal(value: string): boolean {
    return (
        /^\d+(\.\d{1,6})?$/.test(value) &&
        Number.isFinite(Number(value)) &&
        Number(value) <= Number.MAX_SAFE_INTEGER
    )
}

export function isPhoneNumber(value: string): boolean {
    const phone = value.trim()
    if (!/^\+?[0-9 ()-]+$/.test(phone) || !/\d/.test(phone)) return false
    let open = false
    for (const character of phone) {
        if (character === '(') {
            if (open) return false
            open = true
        }
        if (character === ')') {
            if (!open) return false
            open = false
        }
    }
    return !open && !/\(\s*\)/.test(phone)
}

export function isLicensePlate(value: string): boolean {
    return /^[a-zA-Z0-9 -]+$/.test(value.trim()) && /[a-zA-Z]/.test(value) && /\d/.test(value)
}

export function isRecordId(value: string): boolean {
    return isNonnegativeInteger(value, Number.MAX_SAFE_INTEGER) && Number(value) > 0
}
