<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ConversationMessage extends Model
{
    protected $fillable = [
        'booking_request_id',
        'sender_id',
        'type',
        'body',
        'metadata',
        'is_read',
    ];

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
            'is_read'  => 'boolean',
        ];
    }

    // ─── Relationships ───────────────────────────────────────────

    public function booking(): BelongsTo
    {
        return $this->belongsTo(BookingRequest::class, 'booking_request_id');
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    // ─── Scopes ──────────────────────────────────────────────────

    public function scopeUnread($query)
    {
        return $query->where('is_read', false);
    }

    public function scopeForBooking($query, int $bookingId)
    {
        return $query->where('booking_request_id', $bookingId);
    }

    // ─── Helpers ─────────────────────────────────────────────────

    public function isSystem(): bool
    {
        return $this->type === 'system';
    }

    public function isText(): bool
    {
        return $this->type === 'text';
    }
}
