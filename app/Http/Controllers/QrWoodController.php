<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Picqer\Barcode\BarcodeGeneratorSVG;

class QrWoodController extends Controller
{
    public function generateBarcode($logCode)
    {
        $generator = new BarcodeGeneratorSVG();
        
        // Menghasilkan Barcode tipe CODE_128 (paling umum untuk logistik)
        $barcodeSvg = $generator->getBarcode($logCode, $generator::TYPE_CODE_128);

        return response()->json([
            'log_code' => $logCode,
            'barcode_svg' => 'data:image/svg+xml;base64,' . base64_encode($barcodeSvg)
        ]);
    }

    public function showBarcode()
    {
        $logCode = 'LOG-8821-DIPANTARA';
        
        $generator = new BarcodeGeneratorSVG();
        // Generate SVG string
        $barcodeSvg = $generator->getBarcode($logCode, $generator::TYPE_CODE_128);
        
        // Encode ke Base64
        $barcodeBase64 = 'data:image/svg+xml;base64,' . base64_encode($barcodeSvg);

        return view('barcode-preview', compact('logCode', 'barcodeBase64'));
    }
}
