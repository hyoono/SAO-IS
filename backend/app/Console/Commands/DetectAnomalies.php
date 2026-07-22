<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class DetectAnomalies extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'sao:detect-anomalies';
    protected $description = 'Use AI to detect anomalies in recent document workflows';

    public function handle(\App\Services\OllamaService $ollama)
    {
        $this->info('Gathering system statistics...');
        
        $lastWeek = now()->subDays(7);
        $totalSubmitted = \App\Models\Document::where('created_at', '>=', $lastWeek)->count();
        $totalApproved = \App\Models\Document::where('status', 'approved')->where('updated_at', '>=', $lastWeek)->count();
        $totalRejected = \App\Models\Document::where('status', 'rejected')->where('updated_at', '>=', $lastWeek)->count();
        
        // Group by type
        $byType = \App\Models\Document::where('created_at', '>=', $lastWeek)
            ->selectRaw('document_type_id, count(*) as count')
            ->groupBy('document_type_id')
            ->get()
            ->map(function ($doc) {
                return ['type' => $doc->documentType->name, 'count' => $doc->count];
            })->toArray();

        $stats = [
            'period' => 'Last 7 Days',
            'total_submitted' => $totalSubmitted,
            'total_approved' => $totalApproved,
            'total_rejected' => $totalRejected,
            'by_type' => $byType,
        ];

        $systemPrompt = "You are an AI analyzing document workflow statistics for a university Student Affairs Office. Look for unusual patterns (e.g., extremely high rejection rates, spikes in one document type). Return ONLY a valid JSON array of strings, where each string is a 1-sentence anomaly or insight. If everything looks normal, return an empty array [].";
        $userPrompt = json_encode($stats, JSON_PRETTY_PRINT);

        $this->info('Requesting AI analysis...');
        $response = $ollama->generate($userPrompt, $systemPrompt, true);

        if ($response) {
            $cleaned = preg_replace('/```json\s*(.*?)\s*```/s', '$1', $response);
            $decoded = json_decode($cleaned, true) ?? [];
            \Illuminate\Support\Facades\Cache::put('ai_anomalies', $decoded, now()->addHours(24));
            $this->info('Anomalies saved to cache.');
        } else {
            $this->error('Failed to get AI response.');
        }
    }
}
