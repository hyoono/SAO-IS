<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Report extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'center_id',
        'title',
        'file_path',
        'original_filename',
        'mime_type',
        'file_size',
        'uploaded_by',
        'report_date',
    ];

    protected function casts(): array
    {
        return [
            'file_size' => 'integer',
            'report_date' => 'date',
        ];
    }

    // ── Relationships ──

    public function center()
    {
        return $this->belongsTo(Center::class);
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
