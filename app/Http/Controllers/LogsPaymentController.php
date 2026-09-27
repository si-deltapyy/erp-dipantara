<?php
namespace App\Http\Controllers;

use App\Models\LogsPayment;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class LogsPaymentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $payments = LogsPayment::with(['invoice.preOrder.buyer', 'rekening'])
            ->when($request->type, fn($q) => $q->where('type', $request->type))
            ->get();

        return response()->json(['status' => 'success', 'data' => $payments]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'invoice_id' => 'required|exists:invoices,id',
            'rekening_id' => 'required|exists:bank_account_numbers,id',
            'payment_date' => 'required|date',
            'amount' => 'required|numeric',
            'type' => 'required|in:masuk,keluar',
            'payment_proof' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:4096',
            'notes' => 'nullable|string'
        ]);

        if ($request->hasFile('payment_proof')) {
            $validated['payment_proof'] = $request->file('payment_proof')->store('payment_proofs', 'public');
        }

        $payment = LogsPayment::create($validated);
        return response()->json(['status' => 'success', 'message' => 'Pembayaran berhasil dicatat', 'data' => $payment], 201);
    }
}