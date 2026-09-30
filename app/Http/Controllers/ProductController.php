<?php
namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ProductController extends Controller
{
    public function index(): JsonResponse
    {
        $products = Product::all();

        return response()->json([
            'status' => 'success',
            'data' => $products
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'type' => 'required|string', // Jati, Sengon, Mahoni
            'dimension_length' => 'required|numeric',
            'dimension_width' => 'required|numeric',
            'dimension_height' => 'required|numeric',
            'dimension_diameter' => 'required|numeric',
            'volume' => 'nullable|numeric',
            'grade' => 'required|string',
            'price' => 'required|integer'
        ]);

        $product = Product::create($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Produk kayu berhasil ditambahkan',
            'data' => $product
        ], 201);
    }
}