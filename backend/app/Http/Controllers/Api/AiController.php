<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\UnsupportedDocumentTypeException;
use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\DocumentVersion;
use App\Models\User;
use App\Services\ApprovalAuthorizationService;
use App\Services\DocumentTextExtractor;
use App\Services\OllamaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AiController extends Controller
{
    public function __construct(
        protected OllamaService $ollama,
        private readonly DocumentTextExtractor $textExtractor,
        private readonly ApprovalAuthorizationService $approvalAuthorization,
    ) {}

    /**
     * POST /ai/draft
     * Content Drafter for standard letters, memos, etc.
     */
    public function draft(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'topic' => 'required|string',
            'type' => 'required|string|in:memo,letter,certificate,other',
            'additional_instructions' => 'nullable|string',
        ]);

        $systemPrompt = "You are a professional administrative assistant for the Student Affairs Office. Draft a professional {$validated['type']} based on the user's instructions. Keep it concise, formal, and ready to use.";
        
        $userPrompt = "Topic: {$validated['topic']}";
        if (!empty($validated['additional_instructions'])) {
            $userPrompt .= "\nAdditional Instructions: {$validated['additional_instructions']}";
        }

        $response = $this->ollama->generate($userPrompt, $systemPrompt);

        if ($response === null) {
            return response()->json(['message' => 'Failed to generate draft. Ensure Ollama is running.'], 503);
        }

        return response()->json(['draft' => $response]);
    }

    /**
     * POST /ai/extract
     * Automated Data Extraction & OCR Parsing from uploaded files.
     */
    public function extract(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'nullable|file|mimes:pdf,docx,xlsx,png,jpg,jpeg|max:10240',
            'version_id' => 'nullable|uuid|exists:document_versions,id',
            'expected_fields' => 'nullable|array',
        ]);

        if (!$request->hasFile('file') && !$request->filled('version_id')) {
            return response()->json(['message' => 'Provide a file or a version_id.'], 400);
        }

        $filePath = '';
        $mime = '';
        $filename = '';

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $filePath = $file->path();
            $mime = $file->getMimeType();
            $filename = $file->getClientOriginalName();
        } else {
            $version = DocumentVersion::with('document.documentType')->findOrFail($request->input('version_id'));
            $this->authorizeDocumentAccess($request->user(), $version->document);

            if (!Storage::disk('local')->exists($version->file_path)) {
                return response()->json(['message' => 'The requested file is missing from storage.'], 404);
            }

            $filePath = Storage::disk('local')->path($version->file_path);
            $mime = $version->mime_type;
            $filename = $version->original_filename;
        }
        
        $systemPrompt = "You are a data extraction assistant. Extract key information from the provided document text or image. Respond ONLY in valid JSON format matching the expected fields if provided. Do not include markdown formatting or explanations.";

        $expected = $request->input('expected_fields') ? json_encode($request->input('expected_fields')) : 'Extract all key entities.';
        $userPrompt = "Extract information based on these expected fields: {$expected}\n\n";

        if (!$this->textExtractor->isSupported($mime, $filename)) {
            return response()->json(['message' => 'This file type is not supported for AI extraction.'], 422);
        }

        if ($this->textExtractor->isImage($mime, $filename)) {
            $base64 = base64_encode(file_get_contents($filePath));
            $response = $this->ollama->generateVision($userPrompt, [$base64], $systemPrompt, true);
        } else {
            try {
                $textContext = $this->textExtractor->extract($filePath, $mime, $filename);
                $userPrompt .= "Document Text:\n" . substr($textContext, 0, 15000); // truncate if too long
                $response = $this->ollama->generate($userPrompt, $systemPrompt, true);
            } catch (UnsupportedDocumentTypeException $e) {
                return response()->json(['message' => $e->getMessage()], 422);
            } catch (\Throwable $e) {
                return response()->json(['message' => 'Failed to parse document: ' . $e->getMessage()], 500);
            }
        }

        if ($response === null) {
            return response()->json(['message' => 'AI extraction failed.'], 503);
        }

        // Try to decode the JSON response
        $decoded = json_decode($response, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            // Clean up possible markdown code blocks
            $cleaned = preg_replace('/```json\s*(.*?)\s*```/s', '$1', $response);
            $decoded = json_decode($cleaned, true) ?? ['raw' => $response];
        }

        return response()->json(['extracted_data' => $decoded]);
    }

    /**
     * POST /ai/analyze
     * Automated Reporting & Data Analysis Engine
     */
    public function analyze(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'data_payload' => 'required|string',
            'focus_area' => 'nullable|string',
        ]);

        $systemPrompt = "You are a senior data analyst for a university's Student Affairs Office. Analyze the provided dataset and provide an executive summary, highlighting key trends, anomalies, and actionable insights. Format your response clearly with markdown headings and bullet points.";
        
        $userPrompt = "Data Payload:\n{$validated['data_payload']}";
        if (!empty($validated['focus_area'])) {
            $userPrompt .= "\n\nPlease focus your analysis on: {$validated['focus_area']}";
        }

        $response = $this->ollama->generate($userPrompt, $systemPrompt);

        if ($response === null) {
            return response()->json(['message' => 'Analysis failed.'], 503);
        }

        return response()->json(['analysis' => $response]);
    }

    /**
     * POST /ai/translate
     * Bilingual Accessibility Assistant
     */
    public function translate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'text' => 'required|string',
            'mode' => 'required|string|in:tagalog,plain_english,summarize',
        ]);

        $modeInstructions = match($validated['mode']) {
            'tagalog' => 'Translate the following academic/bureaucratic text into clear, accessible Tagalog (Filipino). Maintain a respectful but easy-to-understand tone.',
            'plain_english' => 'Rewrite the following complex academic policy into plain, easy-to-understand English for students.',
            'summarize' => 'Provide a concise, easy-to-understand summary of the following text.',
        };

        $systemPrompt = "You are a helpful bilingual accessibility assistant for a Philippine university. Your goal is to help students understand complex policies.";
        $userPrompt = "{$modeInstructions}\n\nText to process:\n{$validated['text']}";

        $response = $this->ollama->generate($userPrompt, $systemPrompt);

        if ($response === null) {
            return response()->json(['message' => 'Translation failed.'], 503);
        }

        return response()->json(['result' => $response]);
    }

    /**
     * POST /ai/chat
     * AI Document Assistant Chatbot
     */
    public function chat(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'message' => 'required|string',
            'history' => 'nullable|array',
        ]);

        $systemPrompt = "You are a helpful AI Document Assistant for the university's Student Affairs Office. Answer student questions about their documents, requirements, and statuses clearly and concisely.";
        
        $historyText = "";
        if (!empty($validated['history'])) {
            foreach ($validated['history'] as $msg) {
                $role = isset($msg['role']) ? $msg['role'] : 'user';
                $historyText .= ucfirst($role) . ": " . ($msg['content'] ?? '') . "\n";
            }
        }

        $userPrompt = $historyText . "User: {$validated['message']}";

        $response = $this->ollama->generate($userPrompt, $systemPrompt);

        if ($response === null) {
            return response()->json(['message' => 'Chatbot failed to respond.'], 503);
        }

        return response()->json(['reply' => $response]);
    }

    /**
     * POST /ai/suggest-workflow
     * Smart Document Routing - AI suggests workflow steps
     */
    public function suggestWorkflow(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'document_type' => 'required|string',
            'center_name' => 'nullable|string',
        ]);

        $systemPrompt = "You are an AI Workflow Architect for a university Student Affairs Office. Based on the document type, suggest a logical sequence of approval steps. Return a valid JSON array of objects. Each object should have a 'name' (string) and 'role' (string, one of: admin, staff, director, center_head). Do not include markdown formatting, just raw JSON.";

        $userPrompt = "Document Type: {$validated['document_type']}";
        if (!empty($validated['center_name'])) {
            $userPrompt .= "\nCenter: {$validated['center_name']}";
        }

        $response = $this->ollama->generate($userPrompt, $systemPrompt, true);

        if ($response === null) {
            return response()->json(['message' => 'Failed to suggest workflow.'], 503);
        }

        $decoded = json_decode($response, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            $cleaned = preg_replace('/```json\s*(.*?)\s*```/s', '$1', $response);
            $decoded = json_decode($cleaned, true) ?? [];
        }

        return response()->json(['steps' => $decoded]);
    }

    /**
     * POST /ai/classify-document
     * Auto-Fill Form Helper - AI selects document type based on user intent
     */
    public function classifyDocument(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'description' => 'required|string',
            'available_types' => 'required|array',
        ]);

        $systemPrompt = "You are an AI assistant that classifies user intents into predefined document types. You will be provided with a user's natural language request and a list of available document types. Return ONLY a valid JSON object with a single key 'matched_id' corresponding to the 'id' of the best matching document type. If no match is found, return null for the 'matched_id'.";

        $typesJson = json_encode($validated['available_types']);
        $userPrompt = "User Request: {$validated['description']}\n\nAvailable Types: {$typesJson}";

        $response = $this->ollama->generate($userPrompt, $systemPrompt, true);

        if ($response === null) {
            return response()->json(['message' => 'Failed to classify.'], 503);
        }

        $decoded = json_decode($response, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            $cleaned = preg_replace('/```json\s*(.*?)\s*```/s', '$1', $response);
            $decoded = json_decode($cleaned, true) ?? ['matched_id' => null];
        }

        return response()->json($decoded);
    }

    /**
     * POST /ai/verify-document
     * AI-Powered Document Analysis (Quality check)
     */
    public function verifyDocument(Request $request): JsonResponse
    {
        $request->validate([
            'version_id' => 'required|uuid|exists:document_versions,id',
            'expected_type' => 'required|string',
        ]);

        $version = DocumentVersion::with('document.documentType')->findOrFail($request->input('version_id'));
        $this->authorizeDocumentAccess($request->user(), $version->document);

        if (!Storage::disk('local')->exists($version->file_path)) {
            return response()->json(['message' => 'The requested file is missing from storage.'], 404);
        }

        $filePath = Storage::disk('local')->path($version->file_path);
        $mime = $version->mime_type;
        $filename = $version->original_filename;

        $systemPrompt = "You are a document quality assurance AI for a university. Analyze the provided document text/image. Check if it matches the 'Expected Document Type' and verify if it appears complete. Return a valid JSON object with keys: 'is_valid' (boolean), 'confidence' (0-100), and 'reasoning' (1 sentence).";

        $userPrompt = "Expected Document Type: {$request->input('expected_type')}\n\n";

        if (!$this->textExtractor->isSupported($mime, $filename)) {
            return response()->json(['message' => 'This file type is not supported for AI verification.'], 422);
        }

        if ($this->textExtractor->isImage($mime, $filename)) {
            $base64 = base64_encode(file_get_contents($filePath));
            $response = $this->ollama->generateVision($userPrompt, [$base64], $systemPrompt, true);
        } else {
            try {
                $textContext = $this->textExtractor->extract($filePath, $mime, $filename);
                $userPrompt .= "Document Text:\n" . substr($textContext, 0, 15000);
                $response = $this->ollama->generate($userPrompt, $systemPrompt, true);
            } catch (UnsupportedDocumentTypeException $e) {
                return response()->json(['message' => $e->getMessage()], 422);
            } catch (\Throwable $e) {
                return response()->json(['message' => 'Failed to parse document.'], 500);
            }
        }

        if ($response === null) {
            return response()->json(['message' => 'AI verification failed.'], 503);
        }

        $decoded = json_decode($response, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            $cleaned = preg_replace('/```json\s*(.*?)\s*```/s', '$1', $response);
            $decoded = json_decode($cleaned, true) ?? ['is_valid' => false, 'reasoning' => 'Failed to parse AI output.'];
        }

        return response()->json($decoded);
    }

    /**
     * POST /ai/recommend-approval
     * AI reviews document + history and suggests approve/reject
     */
    public function recommendApproval(Request $request): JsonResponse
    {
        $request->validate([
            'document_id' => 'required|uuid|exists:documents,id',
            'step_name' => 'required|string',
        ]);

        $document = Document::with(['latestVersion', 'documentType', 'currentStep'])->findOrFail($request->input('document_id'));

        if (!$this->approvalAuthorization->canReview($request->user(), $document)) {
            abort(403, 'You are not authorized to review this document.');
        }

        if (!$document->latestVersion) {
            return response()->json(['message' => 'No versions to review.'], 400);
        }

        if (!Storage::disk('local')->exists($document->latestVersion->file_path)) {
            return response()->json(['message' => 'The requested file is missing from storage.'], 404);
        }

        $filePath = Storage::disk('local')->path($document->latestVersion->file_path);
        $mime = $document->latestVersion->mime_type;
        $filename = $document->latestVersion->original_filename;

        $systemPrompt = "You are an AI assistant helping a Student Affairs Office staff member decide whether to approve or reject a document. You will be provided with the document's text/image and the current approval step. Return ONLY a valid JSON object with keys: 'recommendation' (string: 'Approve' or 'Reject') and 'reasoning' (string: 1 sentence explaining why).";

        $userPrompt = "Document Type: {$document->documentType->name}\nStep: {$request->input('step_name')}\n\n";

        if (!$this->textExtractor->isSupported($mime, $filename)) {
            return response()->json(['message' => 'This file type is not supported for AI approval recommendations.'], 422);
        }

        if ($this->textExtractor->isImage($mime, $filename)) {
            $base64 = base64_encode(file_get_contents($filePath));
            $response = $this->ollama->generateVision($userPrompt, [$base64], $systemPrompt, true);
        } else {
            try {
                $textContext = $this->textExtractor->extract($filePath, $mime, $filename);
                $userPrompt .= "Document Text:\n" . substr($textContext, 0, 15000);
                $response = $this->ollama->generate($userPrompt, $systemPrompt, true);
            } catch (UnsupportedDocumentTypeException $e) {
                return response()->json(['message' => $e->getMessage()], 422);
            } catch (\Throwable $e) {
                return response()->json(['message' => 'Failed to parse document for recommendation.'], 500);
            }
        }

        if ($response === null) {
            return response()->json(['message' => 'AI recommendation failed.'], 503);
        }

        $decoded = json_decode($response, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            $cleaned = preg_replace('/```json\s*(.*?)\s*```/s', '$1', $response);
            $decoded = json_decode($cleaned, true) ?? ['recommendation' => 'Unknown', 'reasoning' => 'Failed to parse AI output.'];
        }

        return response()->json($decoded);
    }

    /**
     * POST /ai/parse-search
     * Converts natural language to structured search filters
     */
    public function parseSearch(Request $request): JsonResponse
    {
        $request->validate(['query' => 'required|string']);

        $systemPrompt = "You are an AI that converts natural language search queries into structured JSON filters for a document management system. The possible statuses are: 'draft', 'pending', 'in_review', 'approved', 'rejected', 'archived'. Return ONLY a valid JSON object with these exact keys: 'search' (string, the general text to search for), 'status' (string, one of the statuses or null), 'date_range' (string, e.g., 'last_week', 'this_month', 'last_month', 'this_year', or null). If a concept isn't mentioned, use null.";

        $userPrompt = "Query: {$request->input('query')}";

        $response = $this->ollama->generate($userPrompt, $systemPrompt, true);

        if ($response === null) {
            return response()->json(['message' => 'Failed to parse search.'], 503);
        }

        $decoded = json_decode($response, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            $cleaned = preg_replace('/```json\s*(.*?)\s*```/s', '$1', $response);
            $decoded = json_decode($cleaned, true) ?? ['search' => null, 'status' => null, 'date_range' => null];
        }

        return response()->json($decoded);
    }

    /**
     * GET /ai/anomalies
     * Returns cached anomalies generated by the nightly artisan command
     */
    public function getAnomalies(): JsonResponse
    {
        $anomalies = \Illuminate\Support\Facades\Cache::get('ai_anomalies', []);
        return response()->json($anomalies);
    }

    /**
     * POST /ai/generate-report
     * AI generates a weekly summary report in Markdown
     */
    public function generateReport(Request $request): JsonResponse
    {
        $lastWeek = now()->subDays(7);
        $totalSubmitted = \App\Models\Document::where('created_at', '>=', $lastWeek)->count();
        $totalApproved = \App\Models\Document::where('status', 'approved')->where('updated_at', '>=', $lastWeek)->count();
        $totalRejected = \App\Models\Document::where('status', 'rejected')->where('updated_at', '>=', $lastWeek)->count();
        $pending = \App\Models\Document::where('status', 'pending')->count();
        
        $stats = [
            'period' => 'Last 7 Days',
            'total_submitted' => $totalSubmitted,
            'total_approved' => $totalApproved,
            'total_rejected' => $totalRejected,
            'current_pending' => $pending,
        ];

        $systemPrompt = "You are a professional administrative assistant for a university Student Affairs Office. Write a comprehensive weekly report summarizing the document processing statistics provided. The report MUST be formatted in Markdown. Include sections for: Executive Summary, Key Metrics, and Recommendations for improving workflow efficiency based on the data.";
        $userPrompt = "Statistics: " . json_encode($stats, JSON_PRETTY_PRINT);

        $response = $this->ollama->generate($userPrompt, $systemPrompt, false); // Not enforcing JSON, we want markdown

        if ($response === null) {
            return response()->json(['message' => 'Failed to generate report.'], 503);
        }

        return response()->json(['markdown' => trim($response)]);
    }

    /**
     * GET /ai/analytics
     * AI generates predictive and journey analytics for the dashboard
     */
    public function getAnalytics(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $cacheKey = $user->role === 'center_head'
            ? "ai_analytics_center_{$user->center_id}"
            : 'ai_analytics_global';

        // Simple cache to avoid hitting the LLM on every dashboard load
        $analytics = \Illuminate\Support\Facades\Cache::remember($cacheKey, 60 * 60, function () use ($user) {
            $lastWeek = now()->subDays(7);
            $scope = function ($query) use ($user): void {
                if ($user->role === 'center_head') {
                    $query->whereHas('documentType', function ($documentTypeQuery) use ($user): void {
                        $documentTypeQuery->where('center_id', $user->center_id);
                    });
                }
            };

            $pending = Document::query()->where('status', 'pending')->tap($scope)->count();
            $inReview = Document::query()->where('status', 'in_review')->tap($scope)->count();
            
            $stats = [
                'current_backlog' => $pending + $inReview,
                'recent_volume' => Document::query()->where('created_at', '>=', $lastWeek)->tap($scope)->count(),
                'average_processing_time_days' => 2.5, // Mock metric for LLM context
            ];

            $systemPrompt = "You are an AI generating insights for a document management dashboard. Analyze the stats and output a JSON object with two keys: 'predictive' (1-2 sentences predicting workload or processing times for the upcoming week based on the backlog) and 'journey' (1-2 sentences identifying potential bottlenecks or workflow efficiency insights).";
            $userPrompt = json_encode($stats);

            $response = $this->ollama->generate($userPrompt, $systemPrompt, true);

            if ($response) {
                $cleaned = preg_replace('/```json\s*(.*?)\s*```/s', '$1', $response);
                return json_decode($cleaned, true) ?? ['predictive' => 'Unable to generate predictive analytics.', 'journey' => 'Unable to generate journey analytics.'];
            }

            return ['predictive' => 'AI Service unavailable.', 'journey' => 'AI Service unavailable.'];
        });

        return response()->json($analytics);
    }

    private function authorizeDocumentAccess(?User $user, Document $document): void
    {
        if (!$user) {
            abort(401, 'Unauthenticated.');
        }

        $document->loadMissing(['documentType', 'currentStep']);

        if (in_array($user->role, ['admin', 'staff', 'director'], true)) {
            return;
        }

        if ($user->role === 'center_head' && $document->documentType?->center_id === $user->center_id) {
            return;
        }

        if ($document->submitted_by === $user->id) {
            return;
        }

        if ($user->role === 'faculty' && $this->approvalAuthorization->canReview($user, $document)) {
            return;
        }

        abort(403, 'You are not authorized to access this document.');
    }
}
