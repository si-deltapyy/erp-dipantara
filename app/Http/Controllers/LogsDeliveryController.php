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
        $deliveries = LogsDelivery::with('order.preOrder')->get();
        return response()->json(['status' => 'success', 'data' => $deliveries]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'order_id' => 'required|exists:orders,id',
            'sakr_number' => 'required|string',
            'sakr_type' => 'required|in:petani_ke_dipantara,dipantara_ke_buyer', // 2 Jenis SAKR
            'delivery_date' => 'required|date',
            'driver_name' => 'required|string',
            'vehicle_plate' => 'required|string',
            'quantity' => 'required|integer',
            'notes' => 'nullable|string'
        ]);

        $delivery = LogsDelivery::create($validated);

        // Otomatis update status pre_orders menjadi delivered
        if ($delivery->order && $delivery->order->pre_order_id) {
            PreOrders::where('id', $delivery->order->pre_order_id)->update(['pre_order_status' => 'delivered']);
        }

        return response()->json(['status' => 'success', 'message' => 'Surat Jalan SAKR berhasil dibuat', 'data' => $delivery], 201);
    }
}