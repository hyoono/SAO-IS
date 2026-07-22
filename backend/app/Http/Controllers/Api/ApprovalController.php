<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Approval;
use App\Models\AuditLog;
use App\Models\Document;
use App\Models\User;
use App\Services\ApprovalAuthorizationService;
use App\Services\NotificationService;
use App\Services\WorkflowService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ApprovalController extends Controller
{
    public function __construct(
        private readonly WorkflowService $workflowService,
        private readonly NotificationService $notificationService,
        private readonly ApprovalAuthorizationService $approvalAuthorization,
    ) {}

    /**
     * GET /approvals/queue — Docs pending current user's action.
     */
    public function queue(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $query = Document::query()
            ->with(['submitter:id,name,email', 'currentStep:id,name,assignee_role,assignee_user_id,center_id', 'documentType:id,name,center_id', 'documentType.center:id,code,name'])
            ->whereIn('status', ['pending', 'in_review'])
            ->whereHas('currentStep', function ($stepQuery) use ($user): void {
                $stepQuery->where(function ($q) use ($user) {
                    // Direct user assignment
                    $q->where('assignee_user_id', $user->id);

                    // Role-based matching
                    $q->orWhere(function ($roleQuery) use ($user) {
                        $roleQuery->where('assignee_role', $user->role)
                            ->where(function ($centerQ) use ($user) {
                                $centerQ->whereNull('center_id');

                                if ($user->center_id) {
                                    $centerQ->orWhere('center_id', $user->center_id);
                                }
                            });
                    });

                    // Director sees all steps assigned to 'director' role
                    if ($user->role === 'director') {
                        $q->orWhere('assignee_role', 'director');
                    }
                });
            })
            ->latest();

        return response()->json($query->paginate(15));
    }

    /**
     * GET /documents/:id/history — Full approval trail for a document.
     */
    public function history(Document $document): JsonResponse
    {
        $history = Approval::query()
            ->whereHas('workflowInstance', function ($query) use ($document): void {
                $query->where('document_id', $document->id);
            })
            ->with(['reviewer:id,name,email', 'step:id,name,step_order'])
            ->orderBy('reviewed_at')
            ->get();

        return response()->json($history);
    }

    /**
     * POST /documents/:id/approve — Approve current step, advance workflow.
     */
    public function approve(Request $request, Document $document): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $remarks = $request->input('remarks');

        if (!in_array($document->status, ['pending', 'in_review'], true)) {
            return response()->json(['message' => 'Document is not in a reviewable state.'], 422);
        }

        $instance = $document->workflowInstance;
        if (!$instance || !$document->current_step_id) {
            return response()->json(['message' => 'No active workflow instance found.'], 422);
        }

        if (!$this->approvalAuthorization->canReview($user, $document)) {
            abort(403, 'You are not authorized to review this document.');
        }

        // Record the approval
        Approval::create([
            'workflow_instance_id' => $instance->id,
            'step_id' => $document->current_step_id,
            'reviewed_by' => $user->id,
            'decision' => 'approved',
            'remarks' => $remarks,
            'reviewed_at' => now(),
        ]);

        // Advance to next step or finalize
        $result = $this->workflowService->advanceToNextStep($document, $instance);

        // Audit log
        AuditLog::create([
            'user_id' => $user->id,
            'document_id' => $document->id,
            'action' => 'approval.approved',
            'details' => [
                'step_order' => $instance->current_step_order,
                'is_final' => $result['final'],
            ],
        ]);

        if ($result['final']) {
            // Notify submitter of final approval
            $this->notificationService->notifySubmitter(
                $document->submitted_by,
                $document->id,
                "Your document \"{$document->title}\" has been approved."
            );
        } else {
            // Notify submitter of step completion
            $this->notificationService->notifySubmitter(
                $document->submitted_by,
                $document->id,
                "Your document \"{$document->title}\" passed review and moved to the next step."
            );

            // Notify next step assignee
            $nextStep = $result['next_step'];
            if ($nextStep?->assignee_user_id) {
                $this->notificationService->notifyNextAssignee(
                    $nextStep->assignee_user_id,
                    $document->id,
                    $nextStep->name
                );
            }
        }

        $document->refresh();

        return response()->json([
            'message' => $result['final'] ? 'Document approved (final step).' : 'Step approved — advanced to next step.',
            'document' => [
                'id' => $document->id,
                'status' => $document->status,
                'current_step_id' => $document->current_step_id,
            ],
        ]);
    }

    /**
     * POST /documents/:id/reject — Reject document, close workflow.
     */
    public function reject(Request $request, Document $document): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $remarks = $request->input('remarks');

        if (!in_array($document->status, ['pending', 'in_review'], true)) {
            return response()->json(['message' => 'Document is not in a reviewable state.'], 422);
        }

        if (!$this->approvalAuthorization->canReview($user, $document)) {
            abort(403, 'You are not authorized to review this document.');
        }

        $instance = $document->workflowInstance;
        if ($instance && $document->current_step_id) {
            Approval::create([
                'workflow_instance_id' => $instance->id,
                'step_id' => $document->current_step_id,
                'reviewed_by' => $user->id,
                'decision' => 'rejected',
                'remarks' => $remarks,
                'reviewed_at' => now(),
            ]);

            $this->workflowService->rejectDocument($document, $instance);
        } else {
            $document->status = 'rejected';
            $document->save();
        }

        AuditLog::create([
            'user_id' => $user->id,
            'document_id' => $document->id,
            'action' => 'approval.rejected',
            'details' => ['remarks' => $remarks],
        ]);

        $this->notificationService->notifySubmitter(
            $document->submitted_by,
            $document->id,
            "Your document \"{$document->title}\" has been rejected." . ($remarks ? " Reason: {$remarks}" : '')
        );

        return response()->json([
            'message' => 'Document rejected.',
            'document' => ['id' => $document->id, 'status' => $document->status],
        ]);
    }

    /**
     * POST /documents/:id/request-info — Request clarification from submitter.
     */
    public function requestInfo(Request $request, Document $document): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $remarks = $request->input('remarks');

        if (!in_array($document->status, ['pending', 'in_review'], true)) {
            return response()->json(['message' => 'Document is not in a reviewable state.'], 422);
        }

        if (!$this->approvalAuthorization->canReview($user, $document)) {
            abort(403, 'You are not authorized to review this document.');
        }

        $instance = $document->workflowInstance;
        if ($instance && $document->current_step_id) {
            Approval::create([
                'workflow_instance_id' => $instance->id,
                'step_id' => $document->current_step_id,
                'reviewed_by' => $user->id,
                'decision' => 'requested_info',
                'remarks' => $remarks,
                'reviewed_at' => now(),
            ]);
        }

        $this->workflowService->requestInfo($document);

        AuditLog::create([
            'user_id' => $user->id,
            'document_id' => $document->id,
            'action' => 'approval.requested_info',
            'details' => ['remarks' => $remarks],
        ]);

        $this->notificationService->notifySubmitter(
            $document->submitted_by,
            $document->id,
            "Additional information requested for \"{$document->title}\"." . ($remarks ? " Note: {$remarks}" : '')
        );

        return response()->json([
            'message' => 'Additional information requested.',
            'document' => ['id' => $document->id, 'status' => 'awaiting_info'],
        ]);
    }
}
