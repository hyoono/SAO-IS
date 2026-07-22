<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\WorkflowStep;
use App\Models\WorkflowTemplate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class WorkflowController extends Controller
{
    /**
     * GET /workflows — List all workflow templates.
     */
    public function index(): JsonResponse
    {
        $workflows = WorkflowTemplate::query()
            ->withCount('steps')
            ->with('creator:id,name')
            ->latest()
            ->paginate(20);

        return response()->json($workflows);
    }

    /**
     * POST /workflows — Create template with steps array.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'steps' => ['required', 'array', 'min:1'],
            'steps.*.name' => ['required', 'string', 'max:255'],
            'steps.*.assignee_role' => ['required', Rule::in(['admin', 'staff', 'org_officer', 'student', 'faculty', 'director', 'center_head'])],
            'steps.*.assignee_user_id' => ['nullable', 'uuid', Rule::exists('users', 'id')],
            'steps.*.center_id' => ['nullable', 'uuid', Rule::exists('centers', 'id')],
        ]);

        return DB::transaction(function () use ($validated, $request): JsonResponse {
            $template = WorkflowTemplate::create([
                'name' => $validated['name'],
                'description' => $validated['description'] ?? null,
                'created_by' => $request->user()->id,
            ]);

            foreach ($validated['steps'] as $index => $stepData) {
                WorkflowStep::create([
                    'template_id' => $template->id,
                    'step_order' => $index + 1,
                    'name' => $stepData['name'],
                    'assignee_role' => $stepData['assignee_role'],
                    'assignee_user_id' => $stepData['assignee_user_id'] ?? null,
                    'center_id' => $stepData['center_id'] ?? null,
                ]);
            }

            $template->load('steps');

            return response()->json($template, 201);
        });
    }

    /**
     * GET /workflows/:id — Get template + all steps.
     */
    public function show(WorkflowTemplate $workflow): JsonResponse
    {
        $workflow->load(['steps', 'creator:id,name']);

        return response()->json($workflow);
    }

    /**
     * PUT /workflows/:id — Replace all steps (full update).
     */
    public function update(Request $request, WorkflowTemplate $workflow): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'steps' => ['required', 'array', 'min:1'],
            'steps.*.name' => ['required', 'string', 'max:255'],
            'steps.*.assignee_role' => ['required', Rule::in(['admin', 'staff', 'org_officer', 'student', 'faculty', 'director', 'center_head'])],
            'steps.*.assignee_user_id' => ['nullable', 'uuid', Rule::exists('users', 'id')],
            'steps.*.center_id' => ['nullable', 'uuid', Rule::exists('centers', 'id')],
        ]);

        return DB::transaction(function () use ($validated, $workflow): JsonResponse {
            if (isset($validated['name'])) {
                $workflow->name = $validated['name'];
            }
            if (array_key_exists('description', $validated)) {
                $workflow->description = $validated['description'];
            }
            $workflow->save();

            // Delete existing steps and replace
            $workflow->steps()->delete();

            foreach ($validated['steps'] as $index => $stepData) {
                WorkflowStep::create([
                    'template_id' => $workflow->id,
                    'step_order' => $index + 1,
                    'name' => $stepData['name'],
                    'assignee_role' => $stepData['assignee_role'],
                    'assignee_user_id' => $stepData['assignee_user_id'] ?? null,
                    'center_id' => $stepData['center_id'] ?? null,
                ]);
            }

            $workflow->load('steps');

            return response()->json($workflow);
        });
    }

    /**
     * GET /workflows/:id/steps — Get ordered steps only.
     */
    public function steps(WorkflowTemplate $workflow): JsonResponse
    {
        return response()->json($workflow->steps);
    }
}
