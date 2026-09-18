<?php

use App\Http\Controllers\Dashboard;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SpkController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Landing', [
        'title' => 'Dipantara - Sistem Manajemen Pesanan & Keuangan Kayu',
        'message' => 'Selamat datang di Dipantara, sistem manajemen pesanan dan keuangan kayu yang membantu bisnis kayu mengelola stok, pesanan, dan keuangan secara efisien.',
    ]);
});

Route::get('/dashboard',[Dashboard::class, 'index'])->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

Route::get('/generate/spk', [SpkController::class, 'printPdf'])->name('generate.spk');

require __DIR__.'/auth.php';
