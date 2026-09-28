import invoices from './invoices'
export default {
    closings: {
        eligibility: 'Kelayakan closing',
        loading: 'Memeriksa kelayakan closing...',
        refresh: 'Muat ulang',
        assumption:
            'Simulasi: toleransi kuantitas dan saldo nol. Kebijakan produksi menunggu pengesahan.',
        eligible: 'PO memenuhi prasyarat closing',
        blocked: 'PO belum dapat ditutup',
        evaluatedAt: 'Diperiksa pada {date}',
        openWork: '{count} pekerjaan atau revisi masih terbuka',
        quantity: '{count} batang',
        deliveries: 'Periksa pengiriman',
        invoices: 'Periksa invoice',
        quantities: {
            ordered: 'Dipesan',
            assigned: 'Ditugaskan',
            approved: 'Grading approved',
            received: 'Diterima',
        },
        reasons: {
            purchase_order_not_approved: 'PO harus berstatus disetujui.',
            orders_incomplete: 'Order belum tersedia atau belum seluruhnya disetujui.',
            assignments_incomplete:
                'Kuantitas penugasan belum cocok dengan setiap jenis kayu pada PO.',
            grading_incomplete: 'Grading approved aktif belum memenuhi setiap penugasan.',
            deliveries_incomplete: 'Pengiriman belum diterima seluruhnya sesuai kuantitas PO.',
            buyer_invoice_missing: 'Invoice Buyer belum diterbitkan.',
            mitra_invoice_missing:
                'Setiap Mitra penugasan memerlukan invoice yang sudah diterbitkan.',
            buyer_outstanding: 'Invoice Buyer masih memiliki sisa tagihan.',
            mitra_outstanding: 'Invoice Mitra masih memiliki sisa tagihan.',
            open_work: 'Selesaikan draft, perbaikan atau review yang masih terbuka.',
            invoice_revision_required:
                'Terbitkan revisi invoice setelah koreksi grading disetujui.',
        },
        errors: {
            ...invoices.invoices.errors,
            'not-found': 'PO tidak ditemukan atau tidak dapat diakses.',
        },
    },
}
