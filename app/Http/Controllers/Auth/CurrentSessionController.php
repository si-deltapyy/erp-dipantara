<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Resources\SessionUserResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CurrentSessionController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        return response()->json([
            'user' => $request->user() ? new SessionUserResource($request->user()) : null,
        ])->header('Cache-Control', 'no-store');
    }
}
