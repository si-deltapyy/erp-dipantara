<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;
use Spatie\Permission\Models\Role;

class SocialiteController extends Controller
{
    /**
     * Redirect user ke halaman login Google
     */
    public function redirectToGoogle(): JsonResponse
    {
        $url = Socialite::driver('google')->stateless()->redirect()->getTargetUrl();
        
        return response()->json([
            'status' => 'success',
            'url' => $url
        ]);
    }

    /**
     * Handle callback dari Google
     */
    // public function handleGoogleCallback(): JsonResponse
    // {
    //     try {
    //         $googleUser = Socialite::driver('google')->stateless()->user();

    //         // 1. Cari user berdasarkan google_id atau email
    //         $user = User::where('google_id', $googleUser->id)
    //             ->orWhere('email', $googleUser->email)
    //             ->first();

    //         if (!$user) {
    //             // 2. Buat user baru jika belum terdaftar
    //             $user = User::create([
    //                 'name' => $googleUser->name,
    //                 'email' => $googleUser->email,
    //                 'google_id' => $googleUser->id,
    //                 'google_token' => $googleUser->token,
    //                 'password' => null, // Login SSO Google tidak butuh password
    //             ]);

    //             // 3. Tetapkan Role Default dari Spatie Laravel-Permission
    //             // Pastikan Role 'buyer' atau 'user' sudah ada di database/Seeder
    //             $defaultRole = Role::firstOrCreate(['name' => 'buyer', 'guard_name' => 'web']);
    //             $user->assignRole($defaultRole);
    //         } else {
    //             // Update google_id & token jika user sebelumnya mendaftar via email biasa
    //             $user->update([
    //                 'google_id' => $googleUser->id,
    //                 'google_token' => $googleUser->token,
    //             ]);
    //         }

    //         // 4. Generate Token Sanctum untuk Rest API (Gunakan jika SPA/Vue3)
    //         $token = $user->createToken('auth_token')->plainTextToken;

    //         // Ambil daftar roles & permissions spatie
    //         $roles = $user->getRoleNames(); // Returns collection of role names
    //         $permissions = $user->getAllPermissions()->pluck('name');

    //         return response()->json([
    //             'status' => 'success',
    //             'message' => 'Berhasil login dengan Google',
    //             'data' => [
    //                 'user' => $user,
    //                 'roles' => $roles,
    //                 'permissions' => $permissions,
    //                 'token' => $token,
    //                 'token_type' => 'Bearer'
    //             ]
    //         ]);

    //     } catch (\Exception $e) {
    //         return response()->json([
    //             'status' => 'error',
    //             'message' => 'Gagal autentikasi Google: ' . $e->getMessage()
    //         ], 500);
    //     }
    // }

    // public function logout(): JsonResponse
    // {
    //     $user = Auth::user();
    //     if ($user) {
    //         // Hapus semua token untuk user ini
    //         $user->tokens()->delete();

    //         return response()->json([
    //             'status' => 'success',
    //             'message' => 'Berhasil logout'
    //         ]);
    //     }

    //     return response()->json([
    //         'status' => 'error',
    //         'message' => 'User tidak ditemukan atau sudah logout'
    //     ], 401);
    // }

    public function handleGoogleCallback()
    {
        try {
            $googleUser = Socialite::driver('google')->stateless()->user();

            // 1. Cari user berdasarkan google_id atau email
            $user = User::where('google_id', $googleUser->id)
                ->orWhere('email', $googleUser->email)
                ->first();

            if (!$user) {
                // 2. Buat user baru jika belum terdaftar
                $user = User::create([
                    'name' => $googleUser->name,
                    'email' => $googleUser->email,
                    'google_id' => $googleUser->id,
                    'google_token' => $googleUser->token,
                    'password' => null, // Login SSO Google tidak butuh password
                ]);

                // 3. Tetapkan Role Default dari Spatie Laravel-Permission
                // Pastikan Role 'buyer' atau 'user' sudah ada di database/Seeder
                $defaultRole = Role::firstOrCreate(['name' => 'buyer', 'guard_name' => 'web']);
                $user->assignRole($defaultRole);
            } else {
                // Update google_id & token jika user sebelumnya mendaftar via email biasa
                $user->update([
                    'google_id' => $googleUser->id,
                    'google_token' => $googleUser->token,
                ]);
            }

            // 4. Generate Token Sanctum untuk Rest API (Gunakan jika SPA/Vue3)
            $token = $user->createToken('auth_token')->plainTextToken;

            // Ambil daftar roles & permissions spatie
            $roles = $user->getRoleNames(); // Returns collection of role names
            $permissions = $user->getAllPermissions()->pluck('name');

            return redirect()->away(env('FRONTEND_URL') . '/auth/callback?token=' . $token . '&token_type=Bearer');

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal autentikasi Google: ' . $e->getMessage()
            ], 500);
        }
    }
}