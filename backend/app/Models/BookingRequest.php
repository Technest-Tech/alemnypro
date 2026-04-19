<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class BookingRequest extends Model
{
    protected $fillable = [
        'student_id',
        'tutor_id',
        'subject_id',
        'lesson_format',
        'message',
        'status',
        'preferred_date',
        'preferred_time',
        'hourly_rate',
        // Payment & sessions tracking
        'lessons_count',
        'total_amount',
        'per_lesson_amount',
        'payment_status',
        'paid_at',
        'sessions_scheduled',
        // Chat system fields
        'payment_token',
        'lesson_type',
        'confirmed_date',
        'confirmed_time',
    ];

    protected function casts(): array
    {
        return [
            'preferred_date'    => 'date',
            'preferred_time'    => 'datetime',
            'confirmed_date'    => 'date',
            'hourly_rate'       => 'decimal:2',
            'total_amount'      => 'decimal:2',
            'per_lesson_amount' => 'decimal:2',
            'paid_at'           => 'datetime',
            'lessons_count'     => 'integer',
            'sessions_scheduled'=> 'integer',
        ];
    }

    // ─── Relationships ───────────────────────────────────────────

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function tutor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'tutor_id');
    }

    public function tutorProfile(): BelongsTo
    {
        return $this->belongsTo(TutorProfile::class, 'tutor_id', 'user_id');
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    public function sessions(): HasMany
    {
        return $this->hasMany(Session::class, 'booking_request_id')->orderBy('session_number');
    }

    public function messages(): HasMany
    {
        return $this->hasMany(ConversationMessage::class)->orderBy('created_at');
    }

    // ─── Scopes ──────────────────────────────────────────────────

    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopePaid($query)
    {
        return $query->where('payment_status', 'paid');
    }

    // ─── Helpers ─────────────────────────────────────────────────

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isAccepted(): bool
    {
        return $this->status === 'accepted';
    }

    public function isPaid(): bool
    {
        return in_array($this->payment_status, ['paid', 'partially_released', 'fully_released']);
    }

    public function isFullyReleased(): bool
    {
        return $this->payment_status === 'fully_released';
    }

    public function remainingSessions(): int
    {
        return max(0, $this->lessons_count - $this->sessions_scheduled);
    }

    public function canScheduleMoreSessions(): bool
    {
        return $this->isPaid() && $this->remainingSessions() > 0;
    }

    public function generatePaymentToken(): string
    {
        $token = Str::random(48);
        $this->update(['payment_token' => $token]);
        return $token;
    }

    public function isTrial(): bool
    {
        return $this->lesson_type === 'trial';
    }
}

