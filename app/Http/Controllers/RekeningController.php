<?php

namespace App\Http\Controllers;

use App\Models\Rekening;
use Illuminate\Http\Request;
use App\Models\BankAccountNumber;
use Illuminate\Http\JsonResponse;

class RekeningController extends Controller
{
   public function index(): JsonResponse
    {
        return response()->json(['status' => 'success', 'data' => BankAccountNumber::all()]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(Rekening $rekening)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Rekening $rekening)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Rekening $rekening)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Rekening $rekening)
    {
        //
    }
}
