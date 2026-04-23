<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DocumentType;
use Illuminate\Http\JsonResponse;

class DocumentTypeController extends Controller
{
    public function index(): JsonResponse
    {
        $documentTypes = DocumentType::query()
            ->with('workflowTemplate:id,name')
            ->orderBy('name')
            ->get();

        return response()->json($documentTypes);
    }
}