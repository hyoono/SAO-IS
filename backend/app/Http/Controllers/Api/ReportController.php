<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Report;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    /**
     * GET /reports — List reports, optionally filtered by center.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Report::with(['center:id,code,name', 'uploader:id,name']);

        // Center-scoped users only see their center's reports
        if ($user->center_id && !in_array($user->role, ['admin', 'director'])) {
            $query->where('center_id', $user->center_id);
        }

        // Optional center filter
        if ($request->has('center_id')) {
            $query->where('center_id', $request->center_id);
        }

        return response()->json($query->latest()->paginate(15));
    }

    /**
     * POST /reports — Upload a report.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'center_id' => 'required|uuid|exists:centers,id',
            'file' => 'required|file|max:20480',
            'report_date' => 'nullable|date',
        ]);

        $user = $request->user();

        // Center-scoped users can only upload to their center
        if ($user->center_id && $user->center_id !== $request->center_id) {
            if (!in_array($user->role, ['admin', 'director'])) {
                return response()->json(['message' => 'You can only upload reports to your own center.'], 403);
            }
        }

        $file = $request->file('file');
        $path = $file->store('reports', 'local');

        $report = Report::create([
            'center_id' => $request->center_id,
            'title' => $request->title,
            'file_path' => $path,
            'original_filename' => $file->getClientOriginalName(),
            'mime_type' => $file->getMimeType(),
            'file_size' => $file->getSize(),
            'uploaded_by' => $user->id,
            'report_date' => $request->report_date,
        ]);

        AuditLog::create([
            'user_id' => $user->id,
            'action' => 'report.uploaded',
            'details' => [
                'report_id' => $report->id,
                'center_id' => $report->center_id,
                'filename' => $report->original_filename,
            ],
        ]);

        return response()->json($report->load(['center:id,code,name', 'uploader:id,name']), 201);
    }

    /**
     * GET /reports/:id/download — Download a report file.
     */
    public function download(Report $report): \Symfony\Component\HttpFoundation\BinaryFileResponse
    {
        $fullPath = storage_path('app/' . $report->file_path);

        if (!file_exists($fullPath)) {
            abort(404, 'Report file not found.');
        }

        return response()->download($fullPath, $report->original_filename, [
            'Content-Type' => $report->mime_type,
        ]);
    }
}
