<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TutorSubject extends Model
{
    protected $fillable = [
        'tutor_profile_id',
        'subject_id',
        'proficiency_level',
        'levels',
        'hourly_rate',
    ];

    protected function casts(): array
    {
        return [
            'levels'      => 'array',
            'hourly_rate' => 'decimal:2',
        ];
    }

    // ─── Relationships ───

    public function tutorProfile()
    {
        return $this->belongsTo(TutorProfile::class);
    }

    public function subject()
    {
        return $this->belongsTo(Subject::class);
    }
}
