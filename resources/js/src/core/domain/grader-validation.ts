import { isPhoneNumber } from './input-validation'
import type { GraderInput, GraderContactInput } from '@/core/types/grader'

export const graderFieldLimits = { name: 255, email: 254, phone: 40, address: 1000 }
export type GraderField = keyof GraderInput
export type GraderErrors = Partial<Record<GraderField, string>>
export function normalizeGraderEmail(email: string): string {
    return email.trim().toLowerCase()
}
export function validateGrader(input: GraderInput): GraderErrors {
    const errors: GraderErrors = {}
    for (const field of Object.keys(graderFieldLimits) as GraderField[]) {
        const value = field === 'name' || field === 'email' ? input[field].trim() : input[field]
        if ((field === 'name' || field === 'email') && !value) errors[field] = 'graders.required'
        else if ([...value].length > graderFieldLimits[field]) errors[field] = 'graders.tooLong'
    }
    if (input.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim()))
        errors.email = 'graders.emailInvalid'
    if (input.phone.trim() && !errors.phone && !isPhoneNumber(input.phone))
        errors.phone = 'ui.validation.phone'
    return errors
}
export function emptyGrader(): GraderInput {
    return { name: '', email: '', phone: '', address: '' }
}
export function graderDraft(input: GraderInput): GraderInput {
    return { name: input.name, email: input.email, phone: input.phone, address: input.address }
}

export function validateGraderContact(
    input: GraderContactInput,
): Partial<Record<keyof GraderContactInput, string>> {
    const errors: Partial<Record<keyof GraderContactInput, string>> = {}
    for (const field of ['phone', 'graderGroup'] as const) {
        if (!input[field].trim()) errors[field] = 'graders.required'
        else if (input[field].length > (field === 'phone' ? 40 : 255))
            errors[field] = 'graders.tooLong'
    }
    if (input.phone.trim() && !errors.phone && !isPhoneNumber(input.phone))
        errors.phone = 'ui.validation.phone'
    return errors
}
