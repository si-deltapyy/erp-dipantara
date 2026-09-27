<?php

namespace App\Http\Controllers;

use App\Models\PreOrders;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class TransactionController extends Controller
{
    public function index(): JsonResponse
    {
        $closingList = PreOrders::with(['buyer', 'orders.mitra', 'invoices.logsPayments'])->get();
        return response()->json(['status' => 'success', 'data' => $closingList]);
    }

    public function closePo(Request $request, $id): JsonResponse
    {
        $preOrder = PreOrders::findOrFail($id);

        $validated = $request->validate([
            'note' => 'nullable|string'
        ]);

        $preOrder->update([
            'pre_order_status' => 'completed',
            'note' => $validated['note'] ?? $preOrder->note
        ]);

        return response()->json(['status' => 'success', 'message' => 'PO Berhasil Ditutup (Closed)']);
    }
}