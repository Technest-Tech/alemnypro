<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Session extends Model
{
    protected $table = 'lesson_sessions'; // Avoids collision with Laravel's built-in 'sessions' table

    protected $fillable = [
        'booking_request_id',
        'tutor_id',
        'student_id',
        'subject_id',
        'session_number',
        'scheduled_at',
        'duration_minutes',
        'lesson_format',
        'meeting_link',
        'recording_link',
        'tutor_notes',
        'status',
        'completed_at',
        'confirmed_at',
        'dispute_window_ends',
        'cancelled_reason',
        'platform_fee_pct',
        'gross_amount',
        'platform_fee',
        'tutor_payout',
        'payout_released_at',
    ];

    protected function casts(): array
    {
        return [
            'scheduled_at'         => 'datetime',
            'completed_at'         => 'datetime',
            'confirmed_at'         => 'datetime',
            'dispute_window_ends'  => 'datetime',
            'payout_released_at'   => 'datetime',
            'platform_fee_pct'     => 'decimal:2',
            'gross_amount'         => 'decimal:2',
            'platform_fee'         => 'decimal:2',
            'tutor_payout'         => 'decimal:2',
            'duration_minutes'     => 'integer',
            'session_number'       => 'integer',
        ];
    }

    // ─── Relationships ────────────────────────────────────────────

    public function booking(): BelongsTo
    {
        return $this->belongsTo(BookingRequest::class, 'booking_request_id');
    }

    public function tutor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'tutor_id');
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    public function dispute(): HasOne
    {
        return $this->hasOne(SessionDispute::class);
    }

    public function walletTransactions(): MorphMany
    {
        return $this->morphMany(WalletTransaction::class, 'reference');
    }

    // ─── Scopes ───────────────────────────────────────────────────

    public function scopeScheduled($query)
    {
        return $query->where('status', 'scheduled');
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    public function scopeDisputed($query)
    {
        return $query->where('status', 'disputed');
    }

    public function scopeConfirmed($query)
    {
        return $query->where('status', 'confirmed');
    }

    public function scopeAwaitingConfirmation($query)
    {
        // Completed but dispute window not yet passed
        return $query->where('status', 'completed')
            ->where('dispute_window_ends', '>', now());
    }

    public function scopeReadyToAutoConfirm(\Illuminate\Database\Eloquent\Builder $query): \Illuminate\Database\Eloquent\Builder
    {
        // Completed, window passed, no dispute — ready for cron to confirm
        return $query->where('status', 'completed')
            ->where('dispute_window_ends', '<=', now());
    }

    public function scopeForTutor($query, int $tutorId)
    {
        return $query->where('tutor_id', $tutorId);
    }

    public function scopeForStudent($query, int $studentId)
    {
        return $query->where('student_id', $studentId);
    }

    public function scopeUpcoming($query)
    {
        return $query->where('status', 'scheduled')
            ->where('scheduled_at', '>', now())
            ->orderBy('scheduled_at', 'asc');
    }

    // ─── Helpers ─────────────────────────────────────────────────

    public function isWithinDisputeWindow(): bool
    {
        return $this->status === 'completed'
            && $this->dispute_window_ends !== null
            && $this->dispute_window_ends->isFuture();
    }

    public function canBeMarkedComplete(): bool
    {
        return $this->status === 'scheduled';
    }

    public function canBeCancelled(): bool
    {
        return $this->status === 'scheduled';
    }

    public function isPayoutReleased(): bool
    {
        return $this->payout_released_at !== null;
    }

    public function disputeWindowRemainingHours(): float
    {
        if (! $this->isWithinDisputeWindow()) {
            return 0;
        }

        return round(now()->floatDiffInHours($this->dispute_window_ends), 1);
    }

    /**
     * Calculate financials from a gross amount and current platform fee %.
     * Returns [platform_fee_pct, gross_amount, platform_fee, tutor_payout]
     */
    public static function calculateFinancials(float $grossAmount): array
    {
        $feePct       = (float) PlatformSetting::getValue('platform_fee_pct', 15.00);
        $platformFee  = round($grossAmount * $feePct / 100, 2);
        $tutorPayout  = round($grossAmount - $platformFee, 2);

        return [
            'platform_fee_pct' => $feePct,
            'gross_amount'     => $grossAmount,
            'platform_fee'     => $platformFee,
            'tutor_payout'     => $tutorPayout,
        ];
    }
}
