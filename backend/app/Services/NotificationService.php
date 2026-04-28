<?php

namespace App\Services;

use App\Models\Notification;

class NotificationService
{
    /**
     * Create an in-app notification for a user.
     */
    public function notify(string $userId, string $message, ?string $documentId = null): Notification
    {
        return Notification::create([
            'user_id' => $userId,
            'document_id' => $documentId,
            'message' => $message,
            'is_read' => false,
        ]);
    }

    /**
     * Notify the document submitter about a status change.
     */
    public function notifySubmitter(string $submitterId, string $documentId, string $message): Notification
    {
        return $this->notify($submitterId, $message, $documentId);
    }

    /**
     * Notify the assignee of the next workflow step.
     */
    public function notifyNextAssignee(string $userId, string $documentId, string $stepName): Notification
    {
        return $this->notify(
            $userId,
            "A document is awaiting your review at step: {$stepName}",
            $documentId
        );
    }
}
