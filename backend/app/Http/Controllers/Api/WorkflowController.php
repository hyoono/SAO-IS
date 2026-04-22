<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\WorkflowTemplate;
use Illuminate\Http\JsonResponse;

class WorkflowController extends Controller
{
    public function index(): JsonResponse
    {
        $workflows = WorkflowTemplate::query()
            ->withCount('steps')
            ->latest()
            ->paginate(20);

        return response()->json($workflows);
    }

    public function show(WorkflowTemplate $workflow): JsonResponse
    {
        $workflow->load('steps');

        return response()->json($workflow);
    }

    public function steps(WorkflowTemplate $workflow): JsonResponse
    {
        return response()->json($workflow->steps);
    }
}
