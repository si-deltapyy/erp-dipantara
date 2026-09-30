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
        $gradings = Grading::with(['preOrder', 'product', 'mitra', 'grader'])->latest()->get();
        return response()->json(['status' => 'success', 'data' => $gradings]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'pre_order_id' => 'required|exists:pre_orders,id',
            'mitra_id' => 'required|exists:mitras,id',
            'grader_id' => 'required|exists:graders,id',
            'product_id' => 'required|exists:products,id',
            'grading_date' => 'required|date',
            'note' => 'nullable|string'
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