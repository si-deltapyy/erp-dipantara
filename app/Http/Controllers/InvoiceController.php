<?
namespace App\Http\Controllers;

use App\Models\Invoice;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class InvoiceController extends Controller
{
    public function index(): JsonResponse
    {
        $invoices = Invoice::with(['preOrder.buyer', 'logsPayments'])->get();
        return response()->json(['status' => 'success', 'data' => $invoices]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'pre_order_id' => 'required|exists:pre_orders,id',
            'invoice_number' => 'required|string|unique:invoices,invoice_number',
            'due_date' => 'required|date',
            'amount' => 'required|numeric',
            'pph_amount' => 'nullable|numeric', // Menampung kasus PPh dipotong Buyer
            'rounding_amount' => 'nullable|numeric', // Kasus pembulatan nominal (ex: 1.564.900 jadi 1.565.000)
            'status' => 'required|in:unpaid,paid,partial'
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