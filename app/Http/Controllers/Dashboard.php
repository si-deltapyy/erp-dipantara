<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Models\LogsOrder;
use App\Models\LogsPayment;
use App\Models\PreOrders;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class Dashboard extends Controller
{
    // public function index()
    // {
    //     $countPreOrdersActive = PreOrders::count();
    //     $countPreOrdersCompleted = PreOrders::where('pre_order_status', ['completed', 'delivered'])->count();
    //     $countPreOrdersProcessed = PreOrders::where('pre_order_status', 'on_process')->count();

    //     $countDebtorsToMitra = Invoice::whereHas('Transaction', function ($query) {
    //         $query->where('status_payment', 'unpaid')
    //             ->where('type_invoice', 'invoice_in');
    //     })->count();

    //     $countDebtorsFromBuyer = Invoice::whereHas('Transaction', function ($query) {
    //         $query->where('status_payment', 'unpaid')
    //             ->where('type_invoice', 'invoice_outstanding');
    //     })->count();

    //     return view('dashboard', compact('countPreOrdersActive', 'countPreOrdersCompleted', 'countPreOrdersProcessed', 'countDebtorsToMitra', 'countDebtorsFromBuyer'));
    // }

    public function index(): JsonResponse
    {
        $totalPoAktif = PreOrders::whereIn('pre_order_status', ['pending', 'on_process', 'delivered'])->count();
        $poMenungguDp = PreOrders::where('pre_order_status', 'pending')->count();
        $poDalamProses = PreOrders::where('pre_order_status', 'on_process')->count();
        $poMenungguPelunasan = PreOrders::where('pre_order_status', 'delivered')->count();

        // $pemasukan = LogsPayment::where('type', 'masuk')->sum('payment_amount');
        // $pengeluaran = LogsPayment::where('type', 'keluar')->sum('payment_amount');
        // $netCashflow = $pemasukan - $pengeluaran;

        return response()->json([
            'status' => 'success',
            'data' => [
                'summary' => [
                    'total_po_aktif' => $totalPoAktif,
                    'po_menunggu_dp' => $poMenungguDp,
                    'po_dalam_proses' => $poDalamProses,
                    'po_menunggu_pelunasan' => $poMenungguPelunasan,
                    // 'pemasukan' => $pemasukan,
                    // 'pengeluaran' => $pengeluaran,
                    // 'net_cashflow' => $netCashflow
                ]
            ]
        ]);
    }
}
