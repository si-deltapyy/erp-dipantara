<?php
namespace App\Http\Controllers;

use App\Models\Invoice;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class InvoiceController extends Controller
{
    public function index(): JsonResponse
    {
        $invoices = Invoice::with(['rekening', 'transaction', 'BankAccount'])->get();
        return response()->json(['status' => 'success', 'data' => $invoices]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'transaction_id' => 'required|exists:transactions,id',
            'invoice_number' => 'required|string|unique:invoices,invoice_number',
            'invoice_date' => 'required|date',
            'type_invoice' => 'required|string',
            'rekening_id' => 'required|exists:rekenings,id',
            'bank_account_number_id' => 'required|exists:bank_account_numbers,id',
            'proff_of_payment' => 'nullable|string',
            'note' => 'nullable|string'
        ]);

        $invoice = Invoice::create($validated);
        return response()->json(['status' => 'success', 'message' => 'Invoice berhasil diterbitkan', 'data' => $invoice], 201);
    }

    public function show($id): JsonResponse
    {
        $invoice = Invoice::with(['preOrder.buyer', 'logsPayments.rekening'])->findOrFail($id);
        return response()->json(['status' => 'success', 'data' => $invoice]);
    }
}