<?php
namespace App\Http\Controllers;

use App\Models\LogsPayment;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class LogsPaymentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $payments = LogsPayment::with(['preOrder.buyer'])
            ->when($request->type, fn($q) => $q->where('type', $request->type))
            ->get();

        return response()->json(['status' => 'success', 'data' => $payments]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'pre_order_id' => 'required|exists:pre_orders,id',
            'order_id' => 'required|exists:orders,id',
            'mitra_id' => 'required|exists:mitras,id',
            'buyer_payment_termin' => 'required|string',
            'mitra_payment_termin' => 'required|string',
            'payment_status' => 'required|in:pending,completed,cancelled',
            'payment_amount' => 'required|numeric',
            'payment_proff' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:2048',
            'payment_date' => 'required|date',
            'payment_due_date' => 'required|date',
            'note' => 'nullable|string',
        ]);

        if ($request->hasFile('payment_proof')) {
            $validated['payment_proof'] = $request->file('payment_proof')->store('payment_proofs', 'public');
        }

        $payment = LogsPayment::create($validated);
        return response()->json(['status' => 'success', 'message' => 'Pembayaran berhasil dicatat', 'data' => $payment], 201);
    }
}