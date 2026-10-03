import type {
    TimberProduct,
    TimberProductRecord,
    TimberProductInput,
    TimberProductUpdate,
    TimberSpecification,
} from '@/core/types/timber-product'
import { timberProductFields } from '@/core/domain/timber-product-validation'
import {
    canonicalDecimal,
    isTimberDimension,
    isTimberPrice,
} from '@/core/domain/timber-measurements'
import { parseMetadata } from './contracts/response-parsers'
import { parseTimestamp } from './contracts/timestamp-parser'
import {
    invalidContract,
    parseId,
    parseNumericId,
    parseNumericDecimal,
    parseDecimal,
    parseMoney,
    parseNumericMoney,
    parseInteger,
    parseObject,
    parseString,
    requireKeys,
} from './contracts/value-parsers'
export {
    parseMasterQuery as parseTimberProductQuery,
    parseMasterLookup as parseTimberProductLookup,
} from './contracts/master-parsers'

function specification(record: Record<string, unknown>): TimberSpecification {
    const text = (field: string): string => {
        const value = parseString(record[field], field).trim()
        if (!value || [...value].length > 255) return invalidContract(field)
        return value
    }
    const dimension = (field: string): string => {
        const value = parseString(record[field], field)
        if (!isTimberDimension(value)) return invalidContract(field)
        return canonicalDecimal(value, 2)
    }
    return {
        name: text('name'),
        gradeCode: text('gradeCode'),
        diameterCm: dimension('diameterCm'),
        lengthM: dimension('lengthM'),
    }
}
function price(value: unknown, field: string): string {
    const amount = parseString(value, field)
    if (!isTimberPrice(amount)) return invalidContract(field)
    return canonicalDecimal(amount, 2)
}
export function parseTimberProductInput(
    value: unknown,
    update = false,
): TimberProductInput | TimberProductUpdate {
    const record = parseObject(value, 'timberProduct')
    requireKeys(record, [...timberProductFields, ...(update ? ['version'] : [])], 'timberProduct')
    const input = {
        ...specification(record),
        purchasePrice: price(record.purchasePrice, 'purchasePrice'),
        salePrice: price(record.salePrice, 'salePrice'),
    }
    return update ? { ...input, version: parseInteger(record.version, 'version') } : input
}
export function parseTimberProduct(value: unknown): TimberProduct {
    const record = parseObject(value, 'timberProduct')
    requireKeys(
        record,
        [
            ...timberProductFields,
            'volumeM3',
            'id',
            'version',
            'createdAt',
            'updatedAt',
            'createdByUserId',
            'submittedByUserId',
            'allowedActions',
        ],
        'timberProduct',
    )
    const volume = parseString(record.volumeM3, 'volumeM3')
    if (!/^\d+\.\d{6}$/.test(volume)) return invalidContract('volumeM3')
    if ('purchasePrice' in record !== 'salePrice' in record) return invalidContract('purchasePrice')
    const prices =
        'purchasePrice' in record
            ? {
                  purchasePrice: price(record.purchasePrice, 'purchasePrice'),
                  salePrice: price(record.salePrice, 'salePrice'),
              }
            : {}
    return {
        ...specification(record),
        ...prices,
        ...parseMetadata(record),
        volumeM3: volume,
        id: parseId(record.id),
        createdAt: parseTimestamp(record.createdAt, 'createdAt'),
        updatedAt: parseTimestamp(record.updatedAt, 'updatedAt'),
    }
}

export function parseTimberProductRecord(value: unknown): TimberProductRecord {
    const product = parseObject(value, 'product')
    return {
        id: parseNumericId(product.id),
        name: parseString(product.name, 'name'),
        type: parseString(product.type, 'type'),
        grade: parseString(product.grade, 'grade'),
        dimensionLength: parseProductDecimal(product.dimension_length, 'dimension_length'),
        dimensionWidth: parseProductDecimal(product.dimension_width, 'dimension_width'),
        dimensionHeight: parseProductDecimal(product.dimension_height, 'dimension_height'),
        dimensionDiameter: parseProductDecimal(product.dimension_diameter, 'dimension_diameter'),
        volume: product.volume === null ? null : parseProductDecimal(product.volume, 'volume'),
        price:
            typeof product.price === 'string'
                ? parseMoney(canonicalDecimal(product.price, 2), 'price')
                : parseNumericMoney(product.price, 'price'),
        createdAt: parseTimestamp(product.created_at, 'created_at'),
        updatedAt: parseTimestamp(product.updated_at, 'updated_at'),
    }
}

function parseProductDecimal(value: unknown, field: string): string {
    return typeof value === 'string'
        ? parseDecimal(value, field)
        : parseNumericDecimal(value, field)
}
