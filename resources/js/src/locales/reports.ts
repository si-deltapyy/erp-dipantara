import purchaseOrders from './purchase-orders'
export default {
    reports: {
        export: 'Ekspor CSV',
        download: 'Unduh ulang CSV',
        exportNotice:
            'CSV memuat seluruh hasil sesuai filter dan akses. Hasil kosong tetap memiliki header. Jika gagal, klik kembali untuk mengulang permintaan yang sama.',
        prices: 'Laporan harga beli',
        quantity: 'Batang',
        volume: 'Volume (m3)',
        unitPrice: 'Harga satuan',
        subtotal: 'Subtotal',
        source: 'Sumber harga',
        unavailable: 'Belum tersedia',
        missing_snapshot: 'Snapshot harga belum tersedia',
        historical_snapshot: 'Snapshot harga historis',
        per_log: 'Per batang',
        per_m3: 'Per m3',
        priceNotice:
            'Harga historis ditampilkan hanya dari snapshot transaksi. Harga master terkini dan pembayaran tidak digunakan sebagai pengganti.',
        search: 'Cari jenis kayu',
        category: 'Kategori diameter',
        all: 'Semua kategori',
        errors: purchaseOrders['purchase-orders'].errors,
    },
}
