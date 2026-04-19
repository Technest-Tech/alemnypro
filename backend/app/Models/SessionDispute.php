<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SessionDispute extends Model
{
    protected $fillable = [
        'session_id',
        'raised_by',
        'reason',
        'evidence_link',
        'status',
        'admin_note',
        'resolved_by',
        'resolved_at',
    ];

    protected function casts(): array
    {
        return [
            'resolved_at' => 'datetime',
        ];
    }

    // ─── Relationships ────────────────────────────────────────────

    public function session(): BelongsTo
    {
        return $this->belongsTo(Session::class);
    }

    public function raisedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'raised_by');
    }

    public function resolvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'resolved_by');
    }

    // ─── Scopes ───────────────────────────────────────────────────

    public function scopeOpen($query)
    {
        return $query->where('status', 'open');
    }

    public function scopeResolved($query)
    {
        return $query->whereIn('status', ['resolved_tutor', 'resolved_student', 'closed']);
    }

    // ─── Helpers ─────────────────────────────────────────────────

    public function isOpen(): bool
    {
        return $this->status === 'open';
    }

    public function resolvedInFavorOf(): ?string
    {
        return match ($this->status) {
            'resolved_tutor'   => 'tutor',
            'resolved_student' => 'student',
            default            => null,
        };
    }
}
