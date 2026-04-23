<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        if ($user->role !== 'admin') {
            abort(403, 'Only admin can view audit logs.');
        }

        $logs = AuditLog::query()
            ->with([
                'user:id,name,email,role',
                'document:id,title,status',
            ])
            ->orderByDesc('created_at')
            ->paginate(25);

        return response()->json($logs);
    }
}