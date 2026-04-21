<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — SAO-IS v1
|--------------------------------------------------------------------------
|
| All routes are prefixed with /api/v1 (configured in bootstrap/app.php).
| Auth: Laravel Sanctum SPA cookie-based authentication.
|
*/

// ── Health check ──
Route::get('/health', function () {
    return response()->json(['status' => 'ok', 'timestamp' => now()]);
});

// ── Auth ──
Route::prefix('auth')->group(function () {
    Route::post('/login', function (Request $request) {
        // Placeholder — Phase 2
        return response()->json(['message' => 'Login endpoint — Phase 2'], 501);
    });

    Route::post('/logout', function () {
        return response()->json(['message' => 'Logout endpoint — Phase 2'], 501);
    });

    Route::get('/me', function () {
        return response()->json(['message' => 'Auth me endpoint — Phase 2'], 501);
    });

    // MS365 SSO — returns 501 until Azure AD is configured
    Route::get('/ms365/redirect', function () {
        return response()->json(['message' => 'MS365 SSO not configured'], 501);
    });

    Route::get('/ms365/callback', function () {
        return response()->json(['message' => 'MS365 SSO not configured'], 501);
    });
});
