<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class TutorDocument extends Model
{
    protected $fillable = [
        'tutor_profile_id',
        'type',
        'file_path',
        'original_filename',
        'mime_type',
        'file_size',
        'status',
        'rejection_reason',
    ];

    // ─── Relationships ───

    public function tutorProfile()
    {
        return $this->belongsTo(TutorProfile::class);
    }

    // ─── Helpers ───

    /**
     * Get a temporary signed URL for admin access.
     * Local: returns a storage URL. S3: would return a presigned URL.
     */
    public function getAccessUrl(): string
    {
        if (Storage::disk('local')->exists($this->file_path)) {
            return route('admin.documents.download', ['id' => $this->id]);
        }
        return '';
    }

    public function getFileSizeForHumansAttribute(): string
    {
        $bytes = $this->file_size;
        if ($bytes < 1024) return "{$bytes} B";
        if ($bytes < 1048576) return round($bytes / 1024, 1) . ' KB';
        return round($bytes / 1048576, 1) . ' MB';
    }

    // ─── Scopes ───

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeByType($query, string $type)
    {
        return $query->where('type', $type);
    }
}
