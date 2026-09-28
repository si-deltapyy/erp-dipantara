<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Contracts\View\View;
use Picqer\Barcode\BarcodeGeneratorSVG;

class QrWoodController extends Controller
{
    public function showBarcode(): View
    {
        $logCode = 'LOG-8821-DIPANTARA';
        $generator = new BarcodeGeneratorSVG();
        $barcodeSvg = $generator->getBarcode($logCode, $generator::TYPE_CODE_128);
        $barcodeBase64 = 'data:image/svg+xml;base64,'.base64_encode($barcodeSvg);

        return view('barcode-preview', compact('logCode', 'barcodeBase64'));
    }

    public function generate($productId): JsonResponse
    {
        $product = Product::findOrFail($productId);
        $qrPayload = json_encode([
            'wood_id' => $product->id,
            'name' => $product->name,
            'type' => $product->type,
            'diameter' => $product->dimension_diameter,
            'length' => $product->dimension_length,
            'grade' => $product->grade
        ]);

        return response()->json([
            'status' => 'success',
            'product_id' => $product->id,
            'qr_data' => $qrPayload
        ]);
    }
}
