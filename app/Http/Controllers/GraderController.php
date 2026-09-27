<?php
namespace App\Http\Controllers;

use App\Models\Grader;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class GraderController extends Controller
{
    public function index(): JsonResponse
    {
        $graders = Grader::with('user')->get();
        return response()->json(['status' => 'success', 'data' => $graders]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'phone_number' => 'required|string',
            'grader_group' => 'required|string'
        ]);

        $grader = Grader::create($validated);
        return response()->json(['status' => 'success', 'message' => 'Grader berhasil dibuat', 'data' => $grader], 201);
    }

    public function show($id): JsonResponse
    {
        $grader = Grader::with('user')->findOrFail($id);
        return response()->json(['status' => 'success', 'data' => $grader]);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $grader = Grader::findOrFail($id);
        $grader->update($request->only(['phone_number', 'grader_group']));
        return response()->json(['status' => 'success', 'message' => 'Data Grader diperbarui', 'data' => $grader]);
    }

    public function destroy($id): JsonResponse
    {
        Grader::findOrFail($id)->delete();
        return response()->json(['status' => 'success', 'message' => 'Grader dihapus']);
    }
}