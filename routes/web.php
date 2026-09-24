<?php

use App\Http\Controllers\Dashboard;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SpkController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/barcode-preview', [\App\Http\Controllers\QrWoodController::class, 'showBarcode'])->name('barcode.preview');

// Route::get('/dashboard',[Dashboard::class, 'index'])->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

Route::get('/generate/spk', [SpkController::class, 'printPdf'])->name('generate.spk');

require __DIR__.'/auth.php';

Route::view('/dipantara/{path?}', 'app')->where('path', '.*')->name('app');
