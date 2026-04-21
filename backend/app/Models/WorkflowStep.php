<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WorkflowStep extends Model
{
    use HasFactory, HasUuids;

    public $timestamps = false;

    protected $fillable = [
        'template_id',
        'step_order',
        'name',
        'assignee_role',
        'assignee_user_id',
    ];

    // ── Relationships ──

    public function template()
    {
        return $this->belongsTo(WorkflowTemplate::class, 'template_id');
    }

    public function assigneeUser()
    {
        return $this->belongsTo(User::class, 'assignee_user_id');
    }

    public function approvals()
    {
        return $this->hasMany(Approval::class, 'step_id');
    }

    public function currentDocuments()
    {
        return $this->hasMany(Document::class, 'current_step_id');
    }
}
