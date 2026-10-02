import { parseString, invalidContract } from './value-parsers'

export function parseTimestamp(value: unknown, path: string): string {
    const timestamp = parseString(value, path)
    if (
        !/^\d{4}-\d{2}-\d{2}T.+(?:Z|[+-]\d{2}:\d{2})$/.test(timestamp) ||
        !Number.isFinite(Date.parse(timestamp))
    )
        return invalidContract(path)
    return timestamp
}
