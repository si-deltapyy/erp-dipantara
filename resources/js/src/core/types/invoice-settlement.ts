import type { InvoiceTerm } from './invoice'
export interface InvoiceTermBalance extends InvoiceTerm {
    readonly index: number
    readonly settledAmount: string
    readonly outstandingAmount: string
    readonly overdue: boolean
}
export interface InvoiceSettlement {
    readonly invoiceId: string
    readonly issuedRevisionNumber: number | null
    readonly operationalDate: string
    readonly invoiceAmount: string
    readonly approvedCredit: string
    readonly outstandingAmount: string
    readonly overdueAmount: string
    readonly terms: readonly InvoiceTermBalance[]
}
