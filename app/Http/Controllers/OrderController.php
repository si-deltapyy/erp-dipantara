<?
namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\PreOrders;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class OrderController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $orders = Order::with(['preOrder.buyer', 'mitra', 'grader.user'])
            ->when($request->search, function ($query, $search) {
                $query->where('order_number', 'like', "%{$search}%");
            })
            ->paginate(10);

        return response()->json([
            'status' => 'success',
            'data' => $orders
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'pre_order_id' => 'required|exists:pre_orders,id',
            'order_number' => 'required|string',
            'order_date' => 'required|date',
            'mitra_id' => 'required|exists:mitras,id',
            'grader_id' => 'required|exists:graders,id',
            'grader_buyer_name' => 'required|string',
            'grader_buyer_phone_number' => 'required|string',
            'note' => 'nullable|string'
        ]);

        $order = Order::create($validated);

        // Update status PreOrder menjadi 'on_process'
        PreOrders::where('id', $validated['pre_order_id'])->update(['pre_order_status' => 'on_process']);

        return response()->json([
            'status' => 'success',
            'message' => 'Order ke Mitra & Grader berhasil dibuat',
            'data' => $order->load(['mitra', 'grader'])
        ], 201);
    }

    public function show($id): JsonResponse
    {
        $order = Order::with(['preOrder.buyer', 'preOrder.product', 'mitra', 'grader.user'])->findOrFail($id);

        return response()->json([
            'status' => 'success',
            'data' => $order
        ]);
    }
}