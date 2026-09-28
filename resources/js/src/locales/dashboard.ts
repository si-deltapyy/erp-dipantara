import invoices from './invoices'
export default {
    dashboard: {
        title: 'Ringkasan operasional',
        description:
            'Pantau pekerjaan dan saldo sesuai akses Anda. Angka mengikuti kondisi transaksi saat dimuat.',
        refresh: 'Muat ulang',
        loading: 'Memuat ringkasan...',
        empty: 'Belum ada ringkasan yang tersedia untuk akses Anda.',
        unavailable: 'Gunakan menu yang tersedia untuk membuka pekerjaan Anda.',
        asOf: 'Diperbarui: {date}',
        simulation: 'Simulasi settlement, bukan ledger',
        countUnit: 'Transaksi sesuai status',
        openList: 'Lihat daftar',
        metrics: {
            'active-purchase-orders': 'PO aktif',
            'prepared-deliveries': 'Pengiriman disiapkan',
            'dispatched-deliveries': 'Pengiriman berjalan',
            'buyer-outstanding': 'Sisa tagihan Buyer',
            'mitra-outstanding': 'Sisa kewajiban Mitra',
        },
        errors: { ...invoices.invoices.errors },
    },
}
