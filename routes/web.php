<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SpkController;
use Illuminate\Support\Facades\Route;

require __DIR__.'/auth.php';
require __DIR__.'/api.php';

Route::get('/', function () {
    return view('welcome');
});

Route::get('/barcode-preview', [\App\Http\Controllers\QrWoodController::class, 'showBarcode'])->name('barcode.preview');

// Route::middleware('auth')->group(function () {
//     Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
//     Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
//     Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
// });

Route::get('/generate/spk', [SpkController::class, 'printPdf'])->name('generate.spk');



Route::view('/app/{path?}', 'app')->where('path', '.*')->name('app');

