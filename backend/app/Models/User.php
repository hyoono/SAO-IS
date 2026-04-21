<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, HasUuids, Notifiable;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'name',
        'email',
        'password_hash',
        'ms365_id',
        'role',
    ];

    /**
     * The attributes that should be hidden for serialization.
     */
    protected $hidden = [
        'password_hash',
    ];

    /**
     * Get the password for authentication.
     * Override because our column is named password_hash instead of password.
     */
    public function getAuthPassword(): string
    {
        return $this->password_hash;
    }

    /**
     * Get the attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'password_hash' => 'hashed',
        ];
    }

    // ── Relationships ──

    public function submittedDocuments()
    {
        return $this->hasMany(Document::class, 'submitted_by');
    }

    public function approvals()
    {
        return $this->hasMany(Approval::class, 'reviewed_by');
    }

    public function notifications()
    {
        return $this->hasMany(Notification::class);
    }

    public function auditLogs()
    {
        return $this->hasMany(AuditLog::class);
    }

    public function workflowTemplates()
    {
        return $this->hasMany(WorkflowTemplate::class, 'created_by');
    }
}
