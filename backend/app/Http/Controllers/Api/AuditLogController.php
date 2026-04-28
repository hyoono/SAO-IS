<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Document;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    /**
     * GET /audit-logs — System-wide log with filters.
     * Admin only (enforced by middleware).
     */
    public function index(Request $request): JsonResponse
    {
        $query = AuditLog::query()
            ->with([
                'user:id,name,email,role',
                'document:id,title,status',
            ])
            ->orderByDesc('created_at');

        // Filter by user
        if ($userId = $request->query('user_id')) {
            $query->where('user_id', $userId);
        }

        // Filter by document
        if ($documentId = $request->query('document_id')) {
            $query->where('document_id', $documentId);
        }

        // Filter by action
        if ($action = $request->query('action')) {
            $query->where('action', $action);
        }

        // Filter by date range
        if ($from = $request->query('from')) {
            $query->where('created_at', '>=', $from);
        }
        if ($to = $request->query('to')) {
            $query->where('created_at', '<=', $to . ' 23:59:59');
        }

        return response()->json($query->paginate(25));
    }

    /**
     * GET /documents/:id/audit — Audit trail for a single document.
     * Admin and staff only (enforced by middleware).
     */
    public function documentAudit(Document $document): JsonResponse
    {
        $logs = AuditLog::query()
            ->where('document_id', $document->id)
            ->with('user:id,name,email,role')
            ->orderByDesc('created_at')
            ->get();

        return response()->json($logs);
    }
}