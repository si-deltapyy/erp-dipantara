<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>SPK Pengolahan Kayu - {{ $spk->spk_number }}</title>
    <style>
        body { font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.4; color: #333; margin: 0; }
        .header-table { width: 100%; border-collapse: collapse; border-bottom: 3px double #333; padding-bottom: 10px; margin-bottom: 20px; }
        .header-text h2 { margin: 0; font-size: 16pt; text-transform: uppercase; text-align: center; }
        .header-text p { margin: 3px 0 0 0; font-size: 9pt; color: #555; text-align: center; }
        
        .spk-title { text-align: center; font-size: 13pt; font-weight: bold; text-transform: uppercase; text-decoration: underline; margin-top: 15px; }
        .spk-number { text-align: center; font-size: 10pt; font-style: italic; margin-bottom: 20px; }
        
        .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .meta-table td { padding: 4px; font-size: 10pt; vertical-align: top; }
        .meta-label { width: 18%; font-weight: bold; }
        .meta-value { width: 32%; }
        
        .section-title { font-size: 11pt; font-weight: bold; background-color: #f2f2f2; padding: 5px 8px; margin-top: 15px; margin-bottom: 10px; border-left: 4px solid #333; }
        
        .data-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 10pt; }
        .data-table th { background-color: #444; color: #fff; padding: 6px 8px; text-align: left; font-weight: bold; border: 1px solid #444; }
        .data-table td { padding: 6px 8px; border: 1px solid #ddd; }
        
        .signature-table { width: 100%; margin-top: 40px; border-collapse: collapse; page-break-inside: avoid; }
        .signature-table td { width: 33.3%; text-align: center; font-size: 10pt; }
        .signature-space { height: 70px; }
    </style>
</head>
<body>

    <!-- KOP SURAT PERUSAHAAN -->
    <table class="header-table">
        <tr>
            <td class="header-text">
                <h2>PT. DIPANTARA INTERIOR WOODWORKING</h2>
                <p>Jl. Raya Industri Pengolahan Kayu No. 12, Bantul, D.I. Yogyakarta</p>
                <p>Telp: (0274) 123456 | Email: production@dipantara-wood.com</p>
            </td>
        </tr>
    </table>

    <div class="spk-title">Surat Perintah Kerja (SPK) Pengolahan</div>
    <div class="spk-number">Nomor: {{ $spk->spk_number }}</div>

    <!-- METADATA SPK -->
    <table class="meta-table">
        <tr>
            <td class="meta-label">Tanggal Terbit</td>
            <td>: {{ \Carbon\Carbon::parse($spk->spk_date)->translatedFormat('d F Y') }}</td>
            <td class="meta-label">Divisi Kerja</td>
            <td>: {{ $spk->division }}</td>
        </tr>
        <tr>
            <td class="meta-label">Target Selesai</td>
            <td>: {{ \Carbon\Carbon::parse($spk->target_date)->translatedFormat('d F Y') }}</td>
            <td class="meta-label">Grader / PJ</td>
            <td>: {{ $spk->grader_name }}</td>
        </tr>
    </table>

    <!-- DETAIL DETAIL ORDER -->
    <div class="section-title">I. Spesifikasi Bahan Baku & Komponen</div>
    <table class="data-table">
        <thead>
            <tr>
                <th>Jenis Kayu</th>
                <th>Instruksi & Spesifikasi Pemotongan (Sawn Timber)</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td style="font-weight: bold; vertical-align: top; width: 25%;">{{ $spk->wood_type }}</td>
                <td style="white-space: pre-line;">{{ $spk->instruction_details }}</td>
            </tr>
        </tbody>
    </table>

    <!-- UNIT TANDA TANGAN -->
    <table class="signature-table">
        <tr>
            <td>
                <p>Dibuat Oleh,</p>
                <div class="signature-space"></div>
                <p style="text-decoration: underline; font-weight: bold;">( PPIC Divisi )</p>
            </td>
            <td>
                <p>Diperiksa Oleh,</p>
                <div class="signature-space"></div>
                <p style="text-decoration: underline; font-weight: bold;">( Supervisor )</p>
            </td>
            <td>
                <p>Diterima & PJ,</p>
                <div class="signature-space"></div>
                <p style="text-decoration: underline; font-weight: bold;">( {{ $spk->grader_name }} )</p>
            </td>
        </tr>
    </table>

</body>
</html>
