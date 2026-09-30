<?php
namespace App\Http\Controllers;

use App\Models\LogsDelivery;
use App\Models\PreOrders;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class LogsDeliveryController extends Controller
{
    public function index(): JsonResponse
    {
        $deliveries = LogsDelivery::with('preOrder', 'mitra', 'grader')->get();
        return response()->json(['status' => 'success', 'data' => $deliveries]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'pre_order_id' => 'required|exists:pre_orders,id',
            'mitra_id' => 'required|exists:mitras,id',
            'grader_id' => 'required|exists:graders,id',
            'SAKR_number_to_buyer' => 'required|string|unique:logs_deliveries,SAKR_number_to_buyer',
            'SAKR_number_to_company' => 'required|string|unique:logs_deliveries,SAKR_number_to_company',
            'delivery_date' => 'required|date',
            'car_plate_number' => 'required|string',
            'delivery_status' => 'required|in:pending,delivered,cancelled,returned,in_transit,on_the_way',
            'note' => 'nullable|string',
        ]);

        $delivery = LogsDelivery::create($validated);

        // Otomatis update status pre_orders menjadi delivered
        if ($delivery->order && $delivery->order->pre_order_id) {
            PreOrders::where('id', $delivery->order->pre_order_id)->update(['pre_order_status' => 'delivered']);
        }

        return response()->json(['status' => 'success', 'message' => 'Surat Jalan SAKR berhasil dibuat', 'data' => $delivery], 201);
    }
}