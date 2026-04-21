<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WorkflowTemplate extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'name',
        'description',
        'created_by',
    ];

    // ── Relationships ──

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function steps()
    {
        return $this->hasMany(WorkflowStep::class, 'template_id')->orderBy('step_order');
    }

    public function documentTypes()
    {
        return $this->hasMany(DocumentType::class, 'workflow_template_id');
    }

    public function workflowInstances()
    {
        return $this->hasMany(WorkflowInstance::class, 'template_id');
    }
}
