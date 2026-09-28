<?php
namespace App\Http\Controllers;

use App\Models\Grading;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class GradingController extends Controller
{
    public function index(): JsonResponse
    {
        $gradings = Grading::with(['order.mitra', 'order.grader.user', 'product'])->get();
        return response()->json(['status' => 'success', 'data' => $gradings]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'order_id' => 'required|exists:orders,id',
            'product_id' => 'required|exists:products,id',
            'length' => 'required|numeric',
            'diameter' => 'required|numeric',
            'volume' => 'required|numeric',
            'quality' => 'required|string',
            'buy_price' => 'required|integer',
            'sell_price' => 'required|integer',
            'notes' => 'nullable|string'
        ]);

        $grading = Grading::create($validated);
        return response()->json(['status' => 'success', 'message' => 'Data grading kayu berhasil dicatat', 'data' => $grading], 201);
    }

    public function show($id): JsonResponse
    {
        $grading = Grading::with(['order', 'product'])->findOrFail($id);
        return response()->json(['status' => 'success', 'data' => $grading]);
    }
}