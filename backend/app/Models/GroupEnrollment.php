<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GroupEnrollment extends Model
{
    protected $fillable = [
        'group_session_id',
        'student_id',
        'status', // enrolled, cancelled, refunded
        'amount_paid',
        'payment_status', // held, released, refunded
        'enrolled_at',
        'cancelled_at',
    ];

    protected function casts(): array
    {
        return [
            'amount_paid' => 'decimal:2',
            'enrolled_at' => 'datetime',
            'cancelled_at' => 'datetime',
        ];
    }

    // ─── Relationships ───

    public function groupSession(): BelongsTo
    {
        return $this->belongsTo(GroupSession::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    // ─── Scopes ───
    
    public function scopeActive($query)
    {
        return $query->where('status', 'enrolled');
    }
}
