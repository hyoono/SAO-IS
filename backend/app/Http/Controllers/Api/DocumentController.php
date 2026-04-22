<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\DocumentVersion;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DocumentController extends Controller
{
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

    public function archive(Request $request, Document $document): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        if (!in_array($user->role, ['admin', 'staff'], true)) {
            abort(403, 'Only admin/staff can archive documents.');
        }

        $document->status = 'archived';
        $document->save();

        return response()->json(['message' => 'Document archived.', 'status' => $document->status]);
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
