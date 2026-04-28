<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\Document;
use App\Models\Notification;
use App\Models\WorkflowInstance;
use App\Models\WorkflowStep;
use Illuminate\Support\Facades\DB;

class WorkflowService
{
    /**
     * Advance a document to the next workflow step after approval.
     * If the current step is the final step, mark the document as approved.
     *
     * @return array{advanced: bool, final: bool, next_step: ?WorkflowStep}
     */
    public function advanceToNextStep(Document $document, WorkflowInstance $instance): array
    {
        $allSteps = WorkflowStep::query()
            ->where('template_id', $instance->template_id)
            ->orderBy('step_order')
            ->get();

        $currentOrder = $instance->current_step_order;
        $nextStep = $allSteps->firstWhere('step_order', '>', $currentOrder);

        if ($nextStep) {
            // Advance to next step
            $instance->current_step_order = $nextStep->step_order;
            $instance->save();

            $document->current_step_id = $nextStep->id;
            $document->status = 'in_review';
            $document->save();

            return ['advanced' => true, 'final' => false, 'next_step' => $nextStep];
        }

        // Final step — mark as approved and close instance
        $instance->status = 'completed';
        $instance->completed_at = now();
        $instance->save();

        $document->status = 'approved';
        $document->current_step_id = null;
        $document->save();

        return ['advanced' => true, 'final' => true, 'next_step' => null];
    }

    /**
     * Reject a document — closes the workflow instance.
     */
    public function rejectDocument(Document $document, WorkflowInstance $instance): void
    {
        $instance->status = 'rejected';
        $instance->completed_at = now();
        $instance->save();

        $document->status = 'rejected';
        $document->current_step_id = null;
        $document->save();
    }

    /**
     * Set document to awaiting_info status.
     */
    public function requestInfo(Document $document): void
    {
        $document->status = 'awaiting_info';
        $document->save();
    }
}
