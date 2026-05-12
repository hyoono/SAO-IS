<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Center extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'code',
        'name',
        'description',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    // ── Relationships ──

    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function documentTypes()
    {
        return $this->hasMany(DocumentType::class);
    }

    public function reports()
    {
        return $this->hasMany(Report::class);
    }
}
