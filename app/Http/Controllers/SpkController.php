<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf as FacadePdf;

class SpkController extends Controller
{
    public function printPdf()
    {
        // 1. Data Dummy (atau dari database nantinya)
        $spkData = [
            'spk_number' => 'SPK-001',
            'spk_date' => '2026-06-01',
            'division' => 'Divisi Produksi', // Diubah menjadi 'division' agar pas dengan Blade Anda
            'grader_name' => 'Grader 1',     // Diubah menjadi 'grader_name' agar pas dengan Blade Anda
            'instruction_details' => 'Instruksi dan spesifikasi pemotongan secara mendetail.',
            'wood_type' => 'Kayu Jati',      // Diubah menjadi 'wood_type' agar pas dengan Blade Anda
            'target_date' => '2026-06-10',   // Menambahkan target_date karena dipanggil di Blade Anda
        ];

        // 2. UBAH DISINI: Ubah array menjadi Object agar pas dengan sintaks $spk->... di Blade
        $spk = (object) $spkData;

        // 3. Render ke View Blade
        $pdf = FacadePdf::loadView('spk.pdf', compact('spk'));

        // 4. Atur Ukuran Kertas
        $pdf->setPaper('a4', 'portrait');

        // 5. Tampilkan di Browser
        return $pdf->stream('SPK-Pengolahan-Kayu-' . $spk->spk_number . '.pdf');
    }
}
