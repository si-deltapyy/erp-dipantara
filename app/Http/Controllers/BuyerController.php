<?php
namespace App\Http\Controllers;

use App\Models\Buyer;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class BuyerController extends Controller
{
    public function index(): JsonResponse
    {
        $buyers = Buyer::all();
        return response()->json(['status' => 'success', 'data' => $buyers]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'company_name' => 'required|string',
            'pic_name' => 'required|string',
            'phone_number' => 'required|string',
            'address' => 'required|string'
        ]);

        $buyer = Buyer::create($validated);
        return response()->json(['status' => 'success', 'message' => 'Buyer berhasil dibuat', 'data' => $buyer], 201);
    }

    public function show($id): JsonResponse
    {
        $buyer = Buyer::with('preOrders')->findOrFail($id);
        return response()->json(['status' => 'success', 'data' => $buyer]);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $buyer = Buyer::findOrFail($id);
        $buyer->update($request->only(['company_name', 'pic_name', 'phone_number', 'address']));
        return response()->json(['status' => 'success', 'message' => 'Data Buyer diperbarui', 'data' => $buyer]);
    }

    public function destroy($id): JsonResponse
    {
        Buyer::findOrFail($id)->delete();
        return response()->json(['status' => 'success', 'message' => 'Buyer dihapus']);
    }
}