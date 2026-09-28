<?
namespace App\Http\Controllers;

use App\Models\BankAccountNumber;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class BankAccountNumberController extends Controller
{
    public function index(): JsonResponse
    {
        $accounts = BankAccountNumber::all();
        return response()->json(['status' => 'success', 'data' => $accounts]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'bank_name' => 'required|string',
            'account_number' => 'required|string',
            'account_holder' => 'required|string'
        ]);

        $account = BankAccountNumber::create($validated);
        return response()->json(['status' => 'success', 'message' => 'Rekening berhasil ditambahkan', 'data' => $account], 201);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $account = BankAccountNumber::findOrFail($id);
        $account->update($request->only(['bank_name', 'account_number', 'account_holder']));
        return response()->json(['status' => 'success', 'message' => 'Rekening diperbarui', 'data' => $account]);
    }

    public function destroy($id): JsonResponse
    {
        BankAccountNumber::findOrFail($id)->delete();
        return response()->json(['status' => 'success', 'message' => 'Rekening dihapus']);
    }
}