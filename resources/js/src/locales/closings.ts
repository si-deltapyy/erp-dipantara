import invoices from './invoices'
export default {
    closings: {
        closed: 'PO telah ditutup',
        reviewCsrf: 'Sesi telah diperbarui. Periksa keputusan lalu konfirmasi kembali.',
        approve: 'Setujui closing',
        reject: 'Tolak closing',
        reason: 'Alasan penolakan',
        reasonInvalid: 'Isi alasan penolakan dengan 1 sampai 2.000 karakter.',
        approveDescription:
            'Kelayakan diperiksa ulang. Persetujuan menutup PO dan mengunci transaksi terkait.',
        rejectDescription:
            'Isi alasan penolakan. PO tetap disetujui dan dapat diajukan kembali setelah perbaikan.',
        reviewConflict: 'Data atau akses berubah. Muat ulang untuk memeriksa kondisi terbaru.',
        title: 'Closing PO',
        listDescription: 'Pantau pengajuan penutupan PO dan keputusan reviewer.',
        filters: 'Cari pengajuan',
        results: 'Pengajuan closing',
        purchaseOrderNumber: 'Nomor PO',
        status: 'Status',
        review: 'Keputusan reviewer',
        detail: 'Detail closing',
        request: 'Ajukan closing',
        history: 'Riwayat closing',
        requestDescription:
            'Pengajuan menunggu persetujuan reviewer berbeda. PO tetap disetujui sampai closing disetujui.',
        notes: 'Catatan pengajuan',
        noNotes: 'Tanpa catatan',
        confirmTitle: 'Ajukan closing PO?',
        refreshEligibility: 'Periksa ulang kelayakan',
        choosePurchaseOrder: 'Pilih PO melalui detail untuk mengajukan closing.',
        purchaseOrders: 'Daftar PO',
        openPurchaseOrder: 'Buka PO',
        back: 'Kembali ke daftar',
        total: '{count} pengajuan closing',
        empty: 'Belum ada pengajuan closing yang sesuai.',
        search: 'Cari nomor PO',
        searchAction: 'Cari',
        statuses: { requested: 'Menunggu persetujuan', approved: 'Disetujui', rejected: 'Ditolak' },
        invalid: 'Periksa nilai field ini.',
        uncertain:
            'Hasil belum diketahui. Ulangi permintaan yang sama atau periksa riwayat sebelum membuat pengajuan baru.',
        retryWrite: 'Ulangi permintaan',
        discardTitle: 'Buang perubahan?',
        discardDescription: 'Catatan yang belum disimpan akan hilang.',

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
            purchase_order_closed:
                'PO sudah ditutup. Histori dan dokumen tetap dapat dibaca sesuai akses.',
            active_request: 'PO sudah memiliki pengajuan closing yang menunggu persetujuan.',
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
