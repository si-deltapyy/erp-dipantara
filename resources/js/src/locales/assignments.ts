import orders from './orders'
export default {
    assignments: {
        terms: 'Termin Mitra',
        noTerms: 'Belum ada termin Mitra.',
        noDueDate: 'Tidak ditentukan',
        title: 'Alokasi Mitra dan Grader',
        add: 'Tambah alokasi',
        edit: 'Edit alokasi',
        save: 'Simpan alokasi',
        mitra: 'Mitra',
        grader: 'Grader',
        timber: 'Kayu',
        quantity: 'Jumlah alokasi',
        activeHint:
            'Grader harus memiliki akun aktif. Total alokasi dibatasi kebutuhan kayu pada PO.',
        inactiveGrader: 'Pilih Grader dengan akun aktif dan identitas login yang valid.',
        invalidTimber: 'Kayu harus tercantum pada kebutuhan PO.',
        capacity: 'Total alokasi melebihi kebutuhan PO.',
        invalid: 'Periksa kembali nilai field ini.',
        loading: 'Memuat alokasi...',
        empty: 'Belum ada alokasi.',
        errors: orders.orders.errors,
    },
}
