<?php

use App\Http\Controllers\Dashboard;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SpkController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function (Request $request) {
    return Inertia::render('LandingPage', [
        'auth' => ['user' => $request->user() ? ['id' => (string) $request->user()->id] : null],
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

Route::view('/app/{path?}', 'frontend')->where('path', '.*')->name('app');
