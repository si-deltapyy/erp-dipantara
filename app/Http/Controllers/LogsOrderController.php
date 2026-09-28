<?php
namespace App\Http\Controllers;

use App\Models\LogsOrder;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class LogsOrderController extends Controller
{
    public function index(): JsonResponse
    {
        $logs = LogsOrder::with('order')->latest()->get();
        return response()->json(['status' => 'success', 'data' => $logs]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'order_id' => 'required|exists:orders,id',
            'status' => 'required|string',
            'description' => 'required|string'
        ]);

        $log = LogsOrder::create($validated);
        return response()->json(['status' => 'success', 'data' => $log], 201);
    }
}