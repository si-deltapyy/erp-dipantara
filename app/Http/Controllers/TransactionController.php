<?php

namespace App\Http\Controllers;

use App\Models\PreOrders;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class TransactionController extends Controller
{
    public function index(): JsonResponse
    {
        $transactions = Transaction::with('preOrder', 'order', 'logPayment')->latest()->get();
        return response()->json(['status' => 'success', 'data' => $transactions]);
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