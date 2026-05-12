<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Center;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CenterController extends Controller
{
    /**
     * GET /centers — List active centers.
     */
    public function index(): JsonResponse
    {
        $centers = Center::where('is_active', true)
            ->orderBy('code')
            ->get();

        return response()->json($centers);
    }

    /**
     * POST /centers — Create a new center (admin only).
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => 'required|string|max:10|unique:centers,code',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $center = Center::create($validated);

        return response()->json($center, 201);
    }

    /**
     * PATCH /centers/:id — Update a center (admin only).
     */
    public function update(Request $request, Center $center): JsonResponse
    {
        $validated = $request->validate([
            'code' => 'sometimes|string|max:10|unique:centers,code,' . $center->id,
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'is_active' => 'sometimes|boolean',
        ]);

        $center->update($validated);

        return response()->json($center);
    }

    /**
     * GET /centers/:id/stats — Center dashboard metrics.
     */
    public function stats(Center $center): JsonResponse
    {
        $documentTypeIds = $center->documentTypes()->pluck('id');

        $stats = [
            'center' => $center->only('id', 'code', 'name'),
            'total_documents' => \App\Models\Document::whereIn('document_type_id', $documentTypeIds)->count(),
            'pending' => \App\Models\Document::whereIn('document_type_id', $documentTypeIds)->whereIn('status', ['pending', 'in_review'])->count(),
            'approved' => \App\Models\Document::whereIn('document_type_id', $documentTypeIds)->where('status', 'approved')->count(),
            'rejected' => \App\Models\Document::whereIn('document_type_id', $documentTypeIds)->where('status', 'rejected')->count(),
            'users' => $center->users()->count(),
            'document_types' => $center->documentTypes()->count(),
        ];

        return response()->json($stats);
    }
}
