<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TutorAvailability extends Model
{
    protected $fillable = [
        'tutor_profile_id',
        'day_of_week',
        'start_time',
        'end_time',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'day_of_week' => 'integer',
        ];
    }

    public function tutorProfile()
    {
        return $this->belongsTo(TutorProfile::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
