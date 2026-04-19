<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GroupSession extends Model
{
    protected $fillable = [
        'tutor_id',
        'subject_id',
        'title_ar',
        'title_en',
        'description_ar',
        'description_en',
        'lesson_format',
        'pricing_model',
        'seat_price',
        'max_capacity',
        'min_threshold',
        'is_first_session_free',
        'status',
        'session_date',
        'session_time',
        'duration_minutes',
        'recurrence',
        'meeting_link',
        'group_chat_id',
        'threshold_checked_at',
        'confirmed_at',
        'cancelled_at',
        'cancellation_reason',
        'tutor_report',
    ];

    protected function casts(): array
    {
        return [
            'seat_price' => 'decimal:2',
            'max_capacity' => 'integer',
            'min_threshold' => 'integer',
            'is_first_session_free' => 'boolean',
            'session_date' => 'date',
            'session_time' => 'datetime',
            'duration_minutes' => 'integer',
            'threshold_checked_at' => 'datetime',
            'confirmed_at' => 'datetime',
            'cancelled_at' => 'datetime',
        ];
    }

    // ─── Relationships ───

    public function tutor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'tutor_id');
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    public function enrollments(): HasMany
    {
        return $this->hasMany(GroupEnrollment::class);
    }
    
    // Students currently enrolled (not cancelled/refunded)
    public function activeEnrollments(): HasMany
    {
        return $this->hasMany(GroupEnrollment::class)->where('status', 'enrolled');
    }

    // ─── Scopes ───

    public function scopeOpen($query)
    {
        return $query->where('status', 'open');
    }

    public function scopeConfirmed($query)
    {
        return $query->where('status', 'confirmed');
    }

    public function scopeUpcoming($query)
    {
        return $query->where('session_date', '>=', now()->toDateString())
                     ->orderBy('session_date')
                     ->orderBy('session_time');
    }

    // ─── Helpers ───

    public function title(string $locale = 'ar'): string
    {
        return $locale === 'ar' ? ($this->title_ar ?: $this->title_en) : ($this->title_en ?: $this->title_ar);
    }

    public function description(string $locale = 'ar'): ?string
    {
        return $locale === 'ar' ? ($this->description_ar ?: $this->description_en) : ($this->description_en ?: $this->description_ar);
    }

    public function currentEnrollmentCount(): int
    {
        return $this->activeEnrollments()->count();
    }

    public function seatsRemaining(): int
    {
        return max(0, $this->max_capacity - $this->currentEnrollmentCount());
    }

    public function isFull(): bool
    {
        return $this->currentEnrollmentCount() >= $this->max_capacity;
    }

    public function isThresholdMet(): bool
    {
        return $this->currentEnrollmentCount() >= $this->min_threshold;
    }
}
