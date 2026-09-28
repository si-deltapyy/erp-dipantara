import { parseInvoice } from '@/api/invoice-mapper'
const baseline = [
    parseInvoice({
        id: 'synthetic-payable-01',
        issuedRevisionNumber: 1,
        issuedTotalAmount: '100000.00',
        revisionReason: null,
        ownerUserId: 'user-demo',
        purchaseOrderNumber: 'DEMO-PO-03',
        counterpartyName: 'Mitra Simulasi 01',
        purchaseOrderId: 'demo-po-03',
        mitraId: 'demo-mitra-01',
        direction: 'payable',
        kind: 'down_payment',
        invoiceDate: '2026-09-27',
        terms: [{ label: 'Termin Mitra simulasi', amount: '100000.00', dueDate: null }],
        notes: null,
        status: 'issued',
        number: 'DEMO-INV-MITRA-01',
        totalAmount: '100000.00',
        outstandingAmount: '100000.00',
        revisionNumber: 1,
        documentId: null,
        createdAt: '2026-09-27T00:00:00Z',
        updatedAt: '2026-09-27T00:00:00Z',
        createdByUserId: 'maker-demo',
        submittedByUserId: null,
        version: 1,
        allowedActions: [],
    }),
]

export const invoiceFixtures = [
    ...baseline,
    ...[
        {
            id: 'demo-invoice-buyer-one',
            direction: 'receivable',
            mitraId: null,
            counterpartyName: 'Perusahaan Simulasi 01',
        },
        {
            id: 'demo-invoice-mitra-one',
            direction: 'payable',
            mitraId: 'demo-mitra-01',
            counterpartyName: 'Mitra Simulasi 01',
        },
        {
            id: 'demo-invoice-buyer-two',
            direction: 'receivable',
            mitraId: null,
            purchaseOrderId: 'demo-po-26',
            ownerUserId: 'multiple-demo',
            purchaseOrderNumber: 'DEMO-PO-26',
            counterpartyName: 'Perusahaan Simulasi 01',
        },
    ].map((link) =>
        parseInvoice({
            ...baseline[0],
            ...link,
            status: 'draft',
            number: null,
            issuedRevisionNumber: null,
            issuedTotalAmount: null,
        }),
    ),
]
