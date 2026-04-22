<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ApprovalController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DocumentController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\WorkflowController;
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

    Route::get('/documents', [DocumentController::class, 'index']);
    Route::get('/documents/search', [DocumentController::class, 'search']);
    Route::get('/documents/{document}', [DocumentController::class, 'show']);
    Route::get('/documents/{document}/versions', [DocumentController::class, 'versions']);
    Route::patch('/documents/{document}/archive', [DocumentController::class, 'archive']);

    Route::get('/approvals/queue', [ApprovalController::class, 'queue']);
    Route::post('/documents/{document}/approve', [ApprovalController::class, 'approve']);
    Route::post('/documents/{document}/reject', [ApprovalController::class, 'reject']);
    Route::post('/documents/{document}/request-info', [ApprovalController::class, 'requestInfo']);
    Route::get('/documents/{document}/history', [ApprovalController::class, 'history']);

    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::patch('/notifications/{notification}/read', [NotificationController::class, 'markRead']);
    Route::patch('/notifications/read-all', [NotificationController::class, 'markAllRead']);

    Route::get('/workflows', [WorkflowController::class, 'index']);
    Route::get('/workflows/{workflow}', [WorkflowController::class, 'show']);
    Route::get('/workflows/{workflow}/steps', [WorkflowController::class, 'steps']);
});
