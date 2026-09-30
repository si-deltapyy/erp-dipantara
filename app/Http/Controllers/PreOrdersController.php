<?php
namespace App\Http\Controllers;

use App\Models\PreOrders;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class PreOrdersController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $preOrders = PreOrders::with(['buyer', 'product', 'orders'])
            ->when($request->search, function ($query, $search) {
                $query->where('pre_order_number', 'like', "%{$search}%");
            })
            ->paginate(10);

        return response()->json([
            'status' => 'success',
            'data' => $preOrders
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'pre_order_number' => 'required|string|unique:pre_orders,pre_order_number',
            'pre_order_date' => 'required|date',
            'pre_order_closing_date' => 'required|date',
            'product_id' => 'required|exists:products,id',
            'buyer_id' => 'required|exists:buyers,id',
            'quantity' => 'required|integer',
            'total_price' => 'nullable|integer',
            'note' => 'nullable|string',
            'pre_order_status' => 'nullable|in:pending,on_process,delivered,completed'
        ]);

        $preOrder = PreOrders::create($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Pre-Order berhasil dibuat',
            'data' => $preOrder->load(['buyer', 'product'])
        ], 201);
    }

    public function show($id): JsonResponse
    {
        $preOrder = PreOrders::with(['buyer', 'product', 'orders.mitra', 'orders.grader'])->findOrFail($id);

        return response()->json([
            'status' => 'success',
            'data' => $preOrder
        ]);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $preOrder = PreOrders::findOrFail($id);

        $validated = $request->validate([
            'pre_order_number' => 'sometimes|string|unique:pre_orders,pre_order_number,'.$id,
            'pre_order_date' => 'sometimes|date',
            'pre_order_closing_date' => 'sometimes|date',
            'pre_order_status' => 'sometimes|in:pending,on_process,delivered,completed',
            'product_id' => 'sometimes|exists:products,id',
            'buyer_id' => 'sometimes|exists:buyers,id',
            'quantity' => 'sometimes|integer',
            'total_price' => 'nullable|integer',
            'note' => 'nullable|string'
        ]);

        $preOrder->update($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Pre-Order berhasil diperbarui',
            'data' => $preOrder
        ]);
    }

    public function destroy($id): JsonResponse
    {
        $preOrder = PreOrders::findOrFail($id);
        $preOrder->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Pre-Order berhasil dihapus'
        ]);
    }
}