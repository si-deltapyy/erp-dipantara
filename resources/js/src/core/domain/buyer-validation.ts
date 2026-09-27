import type { BuyerInput } from '@/core/types/buyer'

export const buyerFieldLimits = { companyName: 255, contactName: 255, phone: 40, address: 1000 }
export type BuyerField = keyof BuyerInput
export type BuyerErrors = Partial<Record<BuyerField, string>>
export function validateBuyer(input: BuyerInput): BuyerErrors {
    const errors: BuyerErrors = {}
    for (const field of Object.keys(buyerFieldLimits) as BuyerField[]) {
        if ((field === 'companyName' || field === 'contactName') && !input[field].trim())
            errors[field] = 'buyers.required'
        else if ([...input[field]].length > buyerFieldLimits[field])
            errors[field] = 'buyers.tooLong'
    }
    return errors
}
export function emptyBuyer(): BuyerInput {
    return { companyName: '', contactName: '', phone: '', address: '' }
}
export function buyerDraft(input: BuyerInput): BuyerInput {
    return {
        companyName: input.companyName,
        contactName: input.contactName,
        phone: input.phone,
        address: input.address,
    }
}
