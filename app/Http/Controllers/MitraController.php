<?php
namespace App\Http\Controllers;

use App\Models\Mitra;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class MitraController extends Controller
{
    public function index(): JsonResponse
    {
        $mitras = Mitra::all();
        return response()->json(['status' => 'success', 'data' => $mitras]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'phone_number' => 'required|string',
            'address' => 'required|string',
            'grader_group' => 'required|string'
        ]);

        $mitra = Mitra::create($validated);
        return response()->json(['status' => 'success', 'message' => 'Mitra berhasil dibuat', 'data' => $mitra], 201);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $mitra = Mitra::findOrFail($id);
        $mitra->update($request->only(['name', 'phone_number', 'address', 'grader_group']));
        return response()->json(['status' => 'success', 'message' => 'Data Mitra diperbarui', 'data' => $mitra]);
    }

    public function destroy($id): JsonResponse
    {
        Mitra::findOrFail($id)->delete();
        return response()->json(['status' => 'success', 'message' => 'Mitra dihapus']);
    }
}