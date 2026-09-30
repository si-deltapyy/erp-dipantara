import type { GraderInput } from '@/core/types/grader'

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
    return errors
}
export function emptyGrader(): GraderInput {
    return { name: '', email: '', phone: '', address: '' }
}
export function graderDraft(input: GraderInput): GraderInput {
    return { name: input.name, email: input.email, phone: input.phone, address: input.address }
}
