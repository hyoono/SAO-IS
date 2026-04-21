<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DocumentType extends Model
{
    use HasFactory, HasUuids;

    public $timestamps = false;

    protected $fillable = [
        'name',
        'workflow_template_id',
        'expiry_days',
    ];

    protected function casts(): array
    {
        return [
            'expiry_days' => 'integer',
            'created_at' => 'datetime',
        ];
    }

    // ── Relationships ──

    public function workflowTemplate()
    {
        return $this->belongsTo(WorkflowTemplate::class, 'workflow_template_id');
    }

    public function documents()
    {
        return $this->hasMany(Document::class, 'document_type_id');
    }
}
