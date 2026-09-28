<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\JsonResponse;

class QrWoodController extends Controller
{
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
