import purchaseOrders from './purchase-orders'
export default {
    reports: {
        export: 'Ekspor CSV',
        download: 'Unduh ulang CSV',
        exportNotice:
            'CSV memuat seluruh hasil sesuai filter dan akses. Hasil kosong tetap memiliki header. Jika gagal, klik kembali untuk mengulang permintaan yang sama.',
        prices: 'Laporan harga beli',
        filters: 'Periode dan cakupan laporan',
        scopeHint: 'Hasil mengikuti periode, filter yang diterapkan, dan hak akses Anda.',
        appliedFiltersHint:
            'Ekspor memakai filter yang sudah diterapkan. Perubahan input belum tersimpan tidak mengubah hasil ekspor.',
        priceResults: 'Rincian harga beli historis',
        resultCount: '{count} baris hasil',
        timber: 'Jenis kayu',
        loading: 'Memuat laporan...',
        refresh: 'Muat ulang',
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
