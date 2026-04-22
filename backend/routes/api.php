<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
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
Route::prefix('auth')->middleware('web')->group(function () {
    Route::post('/login', [AuthController::class, 'login'])->middleware('guest');

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
    });

    // MS365 SSO — returns 501 until Azure AD is configured
    Route::get('/ms365/redirect', function () {
        return response()->json(['message' => 'MS365 SSO not configured'], 501);
    });

    Route::get('/ms365/callback', function () {
        return response()->json(['message' => 'MS365 SSO not configured'], 501);
    });
});

Route::middleware(['web', 'auth:sanctum'])->group(function () {
    Route::get('/dashboard/summary', [DashboardController::class, 'summary']);
});
