<?php

namespace App\Jobs;

use App\Models\AuditLog;
use App\Models\Document;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class ArchiveExpiredDocuments implements ShouldQueue
{
    use Queueable;

    /**
     * Execute the job.
     *
     * Archives all documents whose expires_at date has passed
     * and whose status is not already 'archived' or 'rejected'.
     */
    public function handle(): void
    {
        $expiredDocuments = Document::query()
            ->whereNotNull('expires_at')
            ->where('expires_at', '<', now()->toDateString())
            ->whereNotIn('status', ['archived', 'rejected'])
            ->get();

        $count = 0;

        foreach ($expiredDocuments as $document) {
            $document->status = 'archived';
            $document->current_step_id = null;
            $document->save();

            AuditLog::create([
                'user_id' => $document->submitted_by,
                'document_id' => $document->id,
                'action' => 'document.archive',
                'details' => [
                    'reason' => 'auto_expired',
                    'expired_at' => $document->expires_at->toDateString(),
                ],
            ]);

            $count++;
        }

        if ($count > 0) {
            Log::info("ArchiveExpiredDocuments: archived {$count} expired document(s).");
        }
    }
}
