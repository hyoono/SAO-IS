<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ApprovalController;
use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\CenterController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DocumentTypeController;
use App\Http\Controllers\Api\DocumentController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\UserController;
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
| NOTE: Do NOT add middleware('web') here — statefulApi() in bootstrap
| already applies session/cookie/CSRF middleware for stateful requests.
| Adding it again causes double session init → session invalidation.
|
*/

// ── Health check ──
Route::get('/health', function () {
    return response()->json(['status' => 'ok', 'timestamp' => now()]);
});

// ── Auth ──
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);

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

// ── Authenticated routes ──
Route::middleware(['auth:sanctum', 'audit'])->group(function () {

    // Dashboard
    Route::get('/dashboard/summary', [DashboardController::class, 'summary']);

    // ── Users (admin + director for list/create) ──
    Route::middleware('role:admin,director')->group(function () {
        Route::get('/users', [UserController::class, 'index']);
        Route::post('/users', [UserController::class, 'store']);
    });
    Route::get('/users/{user}', [UserController::class, 'show']);
    Route::patch('/users/{user}', [UserController::class, 'update']);

    // ── Document Types ──
    Route::get('/document-types', [DocumentTypeController::class, 'index']);
    Route::middleware('role:admin,staff,director,center_head')->group(function () {
        Route::post('/document-types', [DocumentTypeController::class, 'store']);
        Route::patch('/document-types/{documentType}', [DocumentTypeController::class, 'update']);
    });

    // ── Documents ──
    Route::get('/documents', [DocumentController::class, 'index']);
    Route::get('/documents/search', [DocumentController::class, 'search']);
    Route::post('/documents', [DocumentController::class, 'store']);
    Route::get('/documents/{document}', [DocumentController::class, 'show']);
    Route::get('/documents/{document}/versions', [DocumentController::class, 'versions']);
    Route::post('/documents/{document}/versions', [DocumentController::class, 'uploadVersion']);
    Route::get('/documents/{document}/versions/{version}/download', [DocumentController::class, 'downloadVersion']);
    Route::patch('/documents/{document}/archive', [DocumentController::class, 'archive']);

    // ── Approvals ──
    Route::get('/approvals/queue', [ApprovalController::class, 'queue']);
    Route::post('/documents/{document}/approve', [ApprovalController::class, 'approve']);
    Route::post('/documents/{document}/reject', [ApprovalController::class, 'reject']);
    Route::post('/documents/{document}/request-info', [ApprovalController::class, 'requestInfo']);
    Route::get('/documents/{document}/history', [ApprovalController::class, 'history']);

    // ── Notifications ──
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::patch('/notifications/{notification}/read', [NotificationController::class, 'markRead']);
    Route::patch('/notifications/read-all', [NotificationController::class, 'markAllRead']);

    // ── Audit Logs (admin + director) ──
    Route::middleware('role:admin,director')->group(function () {
        Route::get('/audit-logs', [AuditLogController::class, 'index']);
        Route::get('/documents/{document}/audit', [AuditLogController::class, 'documentAudit']);
    });

    // ── Workflows (admin + staff + director + center_head) ──
    Route::middleware('role:admin,staff,director,center_head')->group(function () {
        Route::get('/workflows', [WorkflowController::class, 'index']);
        Route::post('/workflows', [WorkflowController::class, 'store']);
        Route::get('/workflows/{workflow}', [WorkflowController::class, 'show']);
        Route::put('/workflows/{workflow}', [WorkflowController::class, 'update']);
        Route::get('/workflows/{workflow}/steps', [WorkflowController::class, 'steps']);
    });

    // ── Centers ──
    Route::get('/centers', [CenterController::class, 'index']);
    Route::middleware('role:admin,director')->group(function () {
        Route::post('/centers', [CenterController::class, 'store']);
        Route::patch('/centers/{center}', [CenterController::class, 'update']);
    });
    Route::middleware('role:admin,director,center_head')->group(function () {
        Route::get('/centers/{center}/stats', [CenterController::class, 'stats']);
    });

    // ── Reports ──
    Route::middleware('role:admin,director,center_head,staff')->group(function () {
        Route::get('/reports', [ReportController::class, 'index']);
        Route::post('/reports', [ReportController::class, 'store']);
        Route::get('/reports/{report}/download', [ReportController::class, 'download']);
    });
});
