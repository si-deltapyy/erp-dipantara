<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Models\LogsOrder;
use App\Models\LogsPayment;
use App\Models\PreOrders;
use Illuminate\Http\Request;

class Dashboard extends Controller
{
    public function index()
    {
        $countPreOrdersActive = PreOrders::count();
        $countPreOrdersCompleted = PreOrders::where('pre_order_status', ['completed', 'delivered'])->count();
        $countPreOrdersProcessed = PreOrders::where('pre_order_status', 'on_process')->count();

        $countDebtorsToMitra = Invoice::whereHas('Transaction', function ($query) {
            $query->where('status_payment', 'unpaid')
                ->where('type_invoice', 'invoice_in');
        })->count();

        $countDebtorsFromBuyer = Invoice::whereHas('Transaction', function ($query) {
            $query->where('status_payment', 'unpaid')
                ->where('type_invoice', 'invoice_outstanding');
        })->count();

        return view('dashboard', compact('countPreOrdersActive', 'countPreOrdersCompleted', 'countPreOrdersProcessed', 'countDebtorsToMitra', 'countDebtorsFromBuyer'));
    }
}
