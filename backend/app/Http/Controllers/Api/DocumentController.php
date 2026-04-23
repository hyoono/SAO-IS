<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\DocumentType;
use App\Models\Document;
use App\Models\DocumentVersion;
use App\Models\WorkflowInstance;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class DocumentController extends Controller
{
    private const ALLOWED_MIME_TYPES = [
        'pdf',
        'docx',
        'xlsx',
        'jpg',
        'jpeg',
        'png',
    ];

    public function index(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $query = Document::query()
            ->with([
                'documentType:id,name',
                'submitter:id,name,email',
                'currentStep:id,name,assignee_role,assignee_user_id',
            ])
            ->latest();

        if (in_array($user->role, ['student', 'org_officer'], true)) {
            $query->where('submitted_by', $user->id);
        }

        if ($user->role === 'faculty') {
            $query->whereHas('currentStep', function ($stepQuery) use ($user): void {
                $stepQuery->where('assignee_role', 'faculty')
                    ->orWhere('assignee_user_id', $user->id);
            });
        }

        if ($status = $request->string('status')->toString()) {
            $query->where('status', $status);
        }

        return response()->json($query->paginate(15));
    }

    public function store(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $validated = $request->validate([
            'document_type_id' => ['required', 'uuid', Rule::exists('document_types', 'id')],
            'title' => ['required', 'string', 'max:255'],
            'file' => ['required', 'file', 'mimes:' . implode(',', self::ALLOWED_MIME_TYPES), 'max:10240'],
        ]);

        return DB::transaction(function () use ($validated, $request, $user): JsonResponse {
            /** @var DocumentType $documentType */
            $documentType = DocumentType::query()
                ->with('workflowTemplate.steps')
                ->findOrFail($validated['document_type_id']);

            $document = Document::create([
                'document_type_id' => $documentType->id,
                'submitted_by' => $user->id,
                'title' => $validated['title'],
                'status' => 'in_review',
                'current_step_id' => null,
                'expires_at' => $documentType->expiry_days ? now()->addDays($documentType->expiry_days)->toDateString() : null,
            ]);

            $firstStep = $documentType->workflowTemplate?->steps?->sortBy('step_order')->first();

            if ($firstStep) {
                $document->current_step_id = $firstStep->id;
                $document->save();
            }

            $storedPath = $this->storeUploadedVersion($document, $request->file('file'), 1);

            DocumentVersion::create([
                'document_id' => $document->id,
                'version_number' => 1,
                'file_path' => $storedPath,
                'original_filename' => $request->file('file')->getClientOriginalName(),
                'mime_type' => $request->file('file')->getClientMimeType(),
                'file_size_bytes' => $request->file('file')->getSize(),
                'uploaded_by' => $user->id,
            ]);

            WorkflowInstance::create([
                'document_id' => $document->id,
                'template_id' => $documentType->workflow_template_id,
                'current_step_order' => 1,
                'status' => 'in_progress',
            ]);

            AuditLog::create([
                'user_id' => $user->id,
                'document_id' => $document->id,
                'action' => 'document.upload',
                'details' => [
                    'title' => $document->title,
                    'document_type_id' => $documentType->id,
                    'version' => 1,
                ],
            ]);

            $document->load([
                'documentType:id,name',
                'submitter:id,name,email',
                'currentStep:id,name,assignee_role,assignee_user_id',
                'versions',
            ]);

            return response()->json($document, 201);
        });
    }

    public function show(Request $request, Document $document): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        if ($this->isForbidden($user, $document)) {
            abort(403, 'You are not authorized to access this document.');
        }

        $document->load([
            'documentType:id,name',
            'submitter:id,name,email',
            'currentStep:id,name,assignee_role,assignee_user_id',
            'versions',
        ]);

        return response()->json($document);
    }

    public function search(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $term = trim((string) $request->query('q', ''));

        $query = Document::query()
            ->with(['documentType:id,name'])
            ->when($term !== '', function ($builder) use ($term): void {
                $builder->where('title', 'like', "%{$term}%");
            })
            ->latest();

        if (in_array($user->role, ['student', 'org_officer'], true)) {
            $query->where('submitted_by', $user->id);
        }

        return response()->json($query->limit(20)->get());
    }

    public function versions(Request $request, Document $document): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        if ($this->isForbidden($user, $document)) {
            abort(403, 'You are not authorized to access this document versions list.');
        }

        $versions = DocumentVersion::query()
            ->where('document_id', $document->id)
            ->orderByDesc('version_number')
            ->get();

        return response()->json($versions);
    }

    public function uploadVersion(Request $request, Document $document): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        if ($this->isForbidden($user, $document)) {
            abort(403, 'You are not authorized to upload new versions for this document.');
        }

        if (!in_array($user->role, ['admin', 'staff'], true) && $document->submitted_by !== $user->id) {
            abort(403, 'Only the owner or admin/staff can upload a new version.');
        }

        $validated = $request->validate([
            'file' => ['required', 'file', 'mimes:' . implode(',', self::ALLOWED_MIME_TYPES), 'max:10240'],
        ]);

        return DB::transaction(function () use ($document, $validated, $request, $user): JsonResponse {
            $nextVersion = (int) DocumentVersion::query()
                ->where('document_id', $document->id)
                ->max('version_number') + 1;

            $uploadedFile = $request->file('file');
            $storedPath = $this->storeUploadedVersion($document, $uploadedFile, $nextVersion);

            $version = DocumentVersion::create([
                'document_id' => $document->id,
                'version_number' => $nextVersion,
                'file_path' => $storedPath,
                'original_filename' => $uploadedFile->getClientOriginalName(),
                'mime_type' => $uploadedFile->getClientMimeType(),
                'file_size_bytes' => $uploadedFile->getSize(),
                'uploaded_by' => $user->id,
            ]);

            if ($document->status === 'awaiting_info') {
                $document->status = 'in_review';
                $document->save();
            }

            AuditLog::create([
                'user_id' => $user->id,
                'document_id' => $document->id,
                'action' => 'document.version_upload',
                'details' => [
                    'title' => $document->title,
                    'version' => $nextVersion,
                ],
            ]);

            return response()->json($version, 201);
        });
    }

    public function downloadVersion(Request $request, Document $document, DocumentVersion $version)
    {
        /** @var User $user */
        $user = $request->user();

        if ($version->document_id !== $document->id) {
            abort(404, 'Version does not belong to the requested document.');
        }

        if ($this->isForbidden($user, $document)) {
            abort(403, 'You are not authorized to download this document version.');
        }

        if (!Storage::disk('local')->exists($version->file_path)) {
            abort(404, 'The requested file is missing from storage.');
        }

        AuditLog::create([
            'user_id' => $user->id,
            'document_id' => $document->id,
            'action' => 'document.download',
            'details' => [
                'version' => $version->version_number,
                'file' => $version->original_filename,
            ],
        ]);

        return Storage::disk('local')->download($version->file_path, $version->original_filename);
    }

    public function archive(Request $request, Document $document): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        if (!in_array($user->role, ['admin', 'staff'], true)) {
            abort(403, 'Only admin/staff can archive documents.');
        }

        $document->status = 'archived';
        $document->save();

        AuditLog::create([
            'user_id' => $user->id,
            'document_id' => $document->id,
            'action' => 'document.archive',
            'details' => [
                'title' => $document->title,
            ],
        ]);

        return response()->json(['message' => 'Document archived.', 'status' => $document->status]);
    }

    private function storeUploadedVersion(Document $document, UploadedFile $file, int $versionNumber): string
    {
        $directory = sprintf('documents/%s/v%d', $document->id, $versionNumber);
        $filename = $file->getClientOriginalName();

        return $file->storeAs($directory, $filename, 'local');
    }

    private function isForbidden(User $user, Document $document): bool
    {
        if (in_array($user->role, ['admin', 'staff'], true)) {
            return false;
        }

        if ($document->submitted_by === $user->id) {
            return false;
        }

        if ($user->role === 'faculty' && $document->currentStep) {
            return $document->currentStep->assignee_role !== 'faculty' && $document->currentStep->assignee_user_id !== $user->id;
        }

        return true;
    }
}
