<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OllamaService
{
    protected string $baseUrl;
    protected string $textModel;
    protected string $visionModel;
    protected int $timeoutSeconds;
    protected int $connectTimeoutSeconds;

    public function __construct()
    {
        $this->baseUrl = config('services.ollama.url');
        $this->textModel = config('services.ollama.text_model');
        $this->visionModel = config('services.ollama.vision_model');
        $this->timeoutSeconds = (int) config('services.ollama.timeout', 120);
        $this->connectTimeoutSeconds = (int) config('services.ollama.connect_timeout', 5);
    }

    /**
     * Generate text using the standard text model.
     */
    public function generate(string $prompt, string $system = '', bool $jsonFormat = false, ?int $timeoutSeconds = null): ?string
    {
        return $this->callOllama($this->textModel, $prompt, $system, [], $jsonFormat, $timeoutSeconds);
    }

    /**
     * Generate text using the vision model (for images).
     */
    public function generateVision(string $prompt, array $imagesBase64, string $system = '', bool $jsonFormat = false, ?int $timeoutSeconds = null): ?string
    {
        return $this->callOllama($this->visionModel, $prompt, $system, $imagesBase64, $jsonFormat, $timeoutSeconds);
    }

    /**
     * Make the HTTP request to Ollama's /api/generate endpoint.
     */
    protected function callOllama(string $model, string $prompt, string $system = '', array $images = [], bool $jsonFormat = false, ?int $timeoutSeconds = null): ?string
    {
        $payload = [
            'model' => $model,
            'prompt' => $prompt,
            'stream' => false,
        ];

        if (!empty($system)) {
            $payload['system'] = $system;
        }

        if (!empty($images)) {
            $payload['images'] = $images;
        }

        if ($jsonFormat) {
            $payload['format'] = 'json';
        }

        try {
            $response = Http::connectTimeout($this->connectTimeoutSeconds)
                ->timeout($timeoutSeconds ?? $this->timeoutSeconds)
                ->post("{$this->baseUrl}/api/generate", $payload);

            if ($response->successful()) {
                return $response->json('response');
            }

            Log::error('Ollama API Error', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            
            return null;
        } catch (\Exception $e) {
            Log::error('Ollama API Exception: ' . $e->getMessage());
            return null;
        }
    }
}
