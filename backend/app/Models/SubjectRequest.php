<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SubjectRequest extends Model
{
    protected $fillable = [
        'user_id',
        'subject_name',
        'category_suggestion',
        'status',
        'admin_notes',
        'created_subject_id',
    ];

    // ─── Relationships ───

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function createdSubject()
    {
        return $this->belongsTo(Subject::class, 'created_subject_id');
    }

    // ─── Scopes ───

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeByUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }
}
