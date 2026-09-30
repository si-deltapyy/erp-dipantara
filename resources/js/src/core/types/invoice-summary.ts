export interface InvoiceBalanceTotals {
    readonly issuedInvoiceCount: number
    readonly invoiceAmount: string
    readonly approvedCredit: string
    readonly outstandingAmount: string
    readonly overdueAmount: string
}
export interface InvoiceDirectionSummary extends InvoiceBalanceTotals {
    readonly downPayment: InvoiceBalanceTotals
}
export interface PurchaseOrderInvoiceSummary {
    readonly purchaseOrderId: string
    readonly operationalDate: string
    readonly receivable: InvoiceDirectionSummary
    readonly payable: InvoiceDirectionSummary
}
