<?php

use App\Http\Controllers\Dashboard;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SpkController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\PreOrdersController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\GradingController;
use App\Http\Controllers\LogsDeliveryController;
use App\Http\Controllers\LogsOrderController;
use App\Http\Controllers\LogsPaymentController;
use App\Http\Controllers\TransactionController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\QrWoodController;
use App\Http\Controllers\BuyerController;
use App\Http\Controllers\MitraController;
use App\Http\Controllers\GraderController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\RekeningController;
use App\Http\Controllers\BankAccountNumberController;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/barcode-preview', [\App\Http\Controllers\QrWoodController::class, 'showBarcode'])->name('barcode.preview');

Route::redirect('/dashboard', '/dipantara')->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

Route::get('/generate/spk', [SpkController::class, 'printPdf'])->name('generate.spk');

require __DIR__.'/auth.php';

Route::view('/dipantara/{path?}', 'frontend')->where('path', '.*')->name('app');

Route::get('/app/{path?}', function (Request $request) {
    $destination = '/dipantara'.substr($request->getRequestUri(), 4);

    return redirect($destination, 302);
})->where('path', '.*');

Route::prefix('v1')->middleware('auth:sanctum')->group(function () {

    // --- DASHBOARD ---
    Route::get('/dashboard', [Dashboard::class, 'index']); // Atau method dashboard yang sesuai

    // --- TRANSAKSI & CORE WORKFLOW ---
    // 1. Pre Orders (Input PO awal)
    Route::apiResource('pre-orders', PreOrdersController::class);

    // 2. Orders (Order ke Mitra/Grader)
    Route::apiResource('orders', OrderController::class);
    Route::apiResource('logs-orders', LogsOrderController::class);

    // 3. Gradings (Proses Grading Kayu)
    Route::apiResource('gradings', GradingController::class);

    // 4. Pengiriman / Deliveries
    Route::apiResource('logs-deliveries', LogsDeliveryController::class);

    // 5. Transaksi Umum
    Route::apiResource('transactions', TransactionController::class);

    // --- FINANCE, PAYMENT & INVOICE ---
    Route::apiResource('logs-payments', LogsPaymentController::class);
    Route::apiResource('invoices', InvoiceController::class);
    Route::get('/invoices/{id}/print', [InvoiceController::class, 'print']);

    // --- SPK & QR CODE WOOD ---
    Route::apiResource('spks', SpkController::class);
    Route::get('/spks/{id}/download', [SpkController::class, 'download']);
    Route::apiResource('qr-woods', QrWoodController::class);

    // --- MASTER DATA ---
    Route::apiResource('buyers', BuyerController::class);
    Route::apiResource('mitras', MitraController::class);
    Route::apiResource('graders', GraderController::class);
    Route::apiResource('products', ProductController::class);
    Route::apiResource('rekenings', RekeningController::class);
    Route::apiResource('bank-account-numbers', BankAccountNumberController::class);

    // --- USER PROFILE ---
    Route::get('/profile', [ProfileController::class, 'show']);
    Route::put('/profile', [ProfileController::class, 'update']);
});