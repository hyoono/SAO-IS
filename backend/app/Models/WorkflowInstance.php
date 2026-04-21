<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WorkflowInstance extends Model
{
    use HasFactory, HasUuids;

    public $timestamps = false;

    protected $fillable = [
        'document_id',
        'template_id',
        'current_step_order',
        'status',
        'started_at',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'current_step_order' => 'integer',
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    // ── Relationships ──

    public function document()
    {
        return $this->belongsTo(Document::class);
    }

    public function template()
    {
        return $this->belongsTo(WorkflowTemplate::class, 'template_id');
    }

    public function approvals()
    {
        return $this->hasMany(Approval::class, 'workflow_instance_id');
    }

    /**
     * Get the current workflow step based on step_order.
     */
    public function currentStep()
    {
        return $this->template->steps()->where('step_order', $this->current_step_order)->first();
    }
}
