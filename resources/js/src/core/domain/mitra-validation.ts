import type { MitraInput } from '@/core/types/mitra'

export const mitraFieldLimits = { name: 255, phone: 40, address: 1000 }
export type MitraField = keyof MitraInput
export type MitraErrors = Partial<Record<MitraField, string>>
export function validateMitra(input: MitraInput): MitraErrors {
    const errors: MitraErrors = {}
    for (const field of Object.keys(mitraFieldLimits) as MitraField[]) {
        if (field === 'name' && !input[field].trim()) errors[field] = 'mitras.required'
        else if ([...input[field]].length > mitraFieldLimits[field])
            errors[field] = 'mitras.tooLong'
    }
    return errors
}
export function emptyMitra(): MitraInput {
    return { name: '', phone: '', address: '' }
}
export function mitraDraft(input: MitraInput): MitraInput {
    return {
        name: input.name,
        phone: input.phone,
        address: input.address,
    }
}
