<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Approval;
use App\Models\Document;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ApprovalController extends Controller
{
    public function queue(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $query = Document::query()
            ->with(['submitter:id,name,email', 'currentStep:id,name,assignee_role,assignee_user_id'])
            ->whereIn('status', ['pending', 'in_review'])
            ->whereHas('currentStep', function ($stepQuery) use ($user): void {
                $stepQuery->where('assignee_role', $user->role)
                    ->orWhere('assignee_user_id', $user->id);
            })
            ->latest();

        return response()->json($query->paginate(15));
    }

    public function history(Document $document): JsonResponse
    {
        $history = Approval::query()
            ->whereHas('workflowInstance', function ($query) use ($document): void {
                $query->where('document_id', $document->id);
            })
            ->with(['reviewer:id,name,email', 'step:id,name,step_order'])
            ->orderByDesc('reviewed_at')
            ->get();

        return response()->json($history);
    }

    public function approve(Request $request, Document $document): JsonResponse
    {
        return $this->handleDecision($request, $document, 'approved', 'approved', 'Document approved.');
    }

    public function reject(Request $request, Document $document): JsonResponse
    {
        return $this->handleDecision($request, $document, 'rejected', 'rejected', 'Document rejected.');
    }

    public function requestInfo(Request $request, Document $document): JsonResponse
    {
        return $this->handleDecision($request, $document, 'requested_info', 'awaiting_info', 'Additional information requested.');
    }

    private function handleDecision(Request $request, Document $document, string $approvalDecision, string $documentStatus, string $message): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $remarks = $request->input('remarks');

        if (!in_array($document->status, ['pending', 'in_review'], true)) {
            return response()->json(['message' => 'Document is not in a reviewable state.'], 422);
        }

        if ($document->workflowInstance && $document->current_step_id) {
            Approval::create([
                'workflow_instance_id' => $document->workflowInstance->id,
                'step_id' => $document->current_step_id,
                'reviewed_by' => $user->id,
                'decision' => $approvalDecision,
                'remarks' => $remarks,
                'reviewed_at' => now(),
            ]);
        }

        $document->status = $documentStatus;
        if (in_array($documentStatus, ['approved', 'rejected'], true)) {
            $document->current_step_id = null;
        }
        $document->save();

        Notification::create([
            'user_id' => $document->submitted_by,
            'document_id' => $document->id,
            'message' => $message,
            'is_read' => false,
        ]);

        return response()->json([
            'message' => $message,
            'document' => [
                'id' => $document->id,
                'status' => $document->status,
            ],
        ]);
    }
}
