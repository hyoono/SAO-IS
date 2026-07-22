<?php

namespace App\Services;

use App\Models\Notification;

class NotificationService
{
    protected \App\Services\OllamaService $ollama;

    public function __construct(\App\Services\OllamaService $ollama)
    {
        $this->ollama = $ollama;
    }

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
        $enhanced = $this->enhanceMessageWithAI("Generate a friendly, concise (1 sentence) notification for the document submitter based on this raw status update: '{$message}'");
        return $this->notify($submitterId, $enhanced ?? $message, $documentId);
    }

    /**
     * Notify the assignee of the next workflow step.
     */
    public function notifyNextAssignee(string $userId, string $documentId, string $stepName): Notification
    {
        $raw = "A document is awaiting your review at step: {$stepName}";
        $enhanced = $this->enhanceMessageWithAI("Generate a professional, urgent (1 sentence) notification for a staff member based on this raw assignment: '{$raw}'");
        return $this->notify($userId, $enhanced ?? $raw, $documentId);
    }

    protected function enhanceMessageWithAI(string $prompt): ?string
    {
        try {
            $system = "You are a notification generation assistant. Return ONLY the final notification text (1 sentence). Do not include quotes, explanations, or metadata.";
            $response = $this->ollama->generate(
                $prompt,
                $system,
                false,
                (int) config('services.ollama.notification_timeout', 8)
            );
            return $response ? trim(str_replace(['"', "'"], '', $response)) : null;
        } catch (\Throwable $e) {
            return null;
        }
    }
}
