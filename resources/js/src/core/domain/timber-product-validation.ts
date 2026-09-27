import type { TimberProduct, TimberProductInput } from '@/core/types/timber-product'
import { canonicalDecimal, isTimberDimension, normalizeDecimalInput } from './timber-measurements'

export type TimberProductField = keyof TimberProductInput
export type TimberProductErrors = Partial<Record<TimberProductField, string>>
export const timberProductFields: readonly TimberProductField[] = [
    'name',
    'gradeCode',
    'diameterCm',
    'lengthM',
    'purchasePrice',
    'salePrice',
]
export function normalizeTimberInput(input: TimberProductInput): TimberProductInput {
    const money = (value: string): string => {
        const normalized = normalizeDecimalInput(value)
        return /^\d+(\.\d{1,2})?$/.test(normalized) ? canonicalDecimal(normalized, 2) : normalized
    }
    return {
        name: input.name.trim(),
        gradeCode: input.gradeCode.trim(),
        diameterCm: normalizeDecimalInput(input.diameterCm),
        lengthM: normalizeDecimalInput(input.lengthM),
        purchasePrice: money(input.purchasePrice),
        salePrice: money(input.salePrice),
    }
}
export function validateTimberProduct(input: TimberProductInput): TimberProductErrors {
    const normalized = normalizeTimberInput(input)
    const errors: TimberProductErrors = {}
    for (const field of timberProductFields) {
        const value = normalized[field]
        if (!value) errors[field] = 'timber-products.required'
        else if (field === 'name' || field === 'gradeCode') {
            if ([...value].length > 255) errors[field] = 'timber-products.tooLong'
        } else if (field === 'diameterCm' || field === 'lengthM') {
            if (!isTimberDimension(value)) errors[field] = 'timber-products.invalidDimension'
        } else if (!/^\d+\.\d{2}$/.test(value)) errors[field] = 'timber-products.invalidPrice'
    }
    return errors
}
export function emptyTimberProduct(): TimberProductInput {
    return {
        name: '',
        gradeCode: '',
        diameterCm: '',
        lengthM: '',
        purchasePrice: '',
        salePrice: '',
    }
}
export function timberProductDraft(record: TimberProduct): TimberProductInput {
    return {
        name: record.name,
        gradeCode: record.gradeCode,
        diameterCm: record.diameterCm,
        lengthM: record.lengthM,
        purchasePrice: record.purchasePrice ?? '',
        salePrice: record.salePrice ?? '',
    }
}
