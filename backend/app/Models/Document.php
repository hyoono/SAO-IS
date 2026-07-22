<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Document extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'document_type_id',
        'submitted_by',
        'title',
        'status',
        'current_step_id',
        'expires_at',
    ];

    protected function casts(): array
    {
        return [
            'expires_at' => 'date',
        ];
    }

    // ── Relationships ──

    public function documentType()
    {
        return $this->belongsTo(DocumentType::class, 'document_type_id');
    }

    public function submitter()
    {
        return $this->belongsTo(User::class, 'submitted_by');
    }

    public function currentStep()
    {
        return $this->belongsTo(WorkflowStep::class, 'current_step_id');
    }

    public function versions()
    {
        return $this->hasMany(DocumentVersion::class)->orderBy('version_number', 'desc');
    }

    public function latestVersion()
    {
        return $this->hasOne(DocumentVersion::class)->ofMany('version_number', 'max');
    }

    public function workflowInstance()
    {
        return $this->hasOne(WorkflowInstance::class);
    }

    public function auditLogs()
    {
        return $this->hasMany(AuditLog::class);
    }

    public function notifications()
    {
        return $this->hasMany(Notification::class);
    }
}
