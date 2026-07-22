<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DocumentType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class DocumentTypeController extends Controller
{
    /**
     * GET /document-types — List all document types.
     */
    public function index(): JsonResponse
    {
        $documentTypes = DocumentType::query()
            ->with(['workflowTemplate:id,name', 'center:id,code,name'])
            ->orderBy('name')
            ->get();

        return response()->json($documentTypes);
    }

    /**
     * POST /document-types — Create a new document type.
     * Admin and staff only.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'workflow_template_id' => ['required', 'uuid', Rule::exists('workflow_templates', 'id')],
            'expiry_days' => ['nullable', 'integer', 'min:1'],
            'center_id' => ['nullable', 'uuid', Rule::exists('centers', 'id')],
        ]);

        $documentType = DocumentType::create($validated);
        $documentType->load(['workflowTemplate:id,name', 'center:id,code,name']);

        return response()->json($documentType, 201);
    }

    /**
     * PATCH /document-types/:id — Update name, expiry rule, or workflow assignment.
     * Admin and staff only.
     */
    public function update(Request $request, DocumentType $documentType): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'workflow_template_id' => ['sometimes', 'uuid', Rule::exists('workflow_templates', 'id')],
            'expiry_days' => ['nullable', 'integer', 'min:1'],
            'center_id' => ['nullable', 'uuid', Rule::exists('centers', 'id')],
        ]);

        $documentType->update($validated);
        $documentType->load(['workflowTemplate:id,name', 'center:id,code,name']);

        return response()->json($documentType);
    }
}