<?php

namespace App\Services;

use App\Models\Document;
use App\Models\User;

class ApprovalAuthorizationService
{
    public function canReview(User $user, Document $document): bool
    {
        $document->loadMissing('currentStep');
        $step = $document->currentStep;

        if (!$step) {
            return false;
        }

        if ($step->assignee_user_id === $user->id) {
            return true;
        }

        if ($step->assignee_role !== $user->role) {
            return false;
        }

        if ($step->center_id === null) {
            return true;
        }

        return $user->center_id !== null && $step->center_id === $user->center_id;
    }
}
