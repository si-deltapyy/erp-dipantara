import type { Invoice } from '@/core/types/invoice'
import type { DemoTransaction } from './transaction'
import { createDemoPdf } from '../demo-pdf'
export async function issueInvoiceDocument(
    transaction: DemoTransaction,
    invoice: Invoice,
): Promise<string> {
    const id = crypto.randomUUID()
    const content = createDemoPdf([
        'INVOICE SIMULASI - BUKAN DOKUMEN PRODUKSI',
        invoice.number ?? '',
        `PO: ${invoice.purchaseOrderNumber}`,
        `Pihak: ${invoice.counterpartyName}`,
        `Tanggal: ${invoice.invoiceDate}`,
        `Versi: ${invoice.revisionNumber}`,
        ...invoice.terms.map(
            (term) => `${term.label}: IDR ${term.amount} | Jatuh tempo: ${term.dueDate ?? '-'}`,
        ),
        `Total: IDR ${invoice.totalAmount}`,
    ])
    await transaction.put('documents', {
        id,
        parentType: 'invoice',
        parentId: invoice.id,
        purpose: 'invoice_pdf',
        fileName: `invoice-${invoice.id}-v${invoice.revisionNumber}.pdf`,
        mimeType: 'application/pdf',
        sizeBytes: content.size,
        content,
        createdByUserId: invoice.createdByUserId,
        expiresAt: null,
    })
    return id
}
