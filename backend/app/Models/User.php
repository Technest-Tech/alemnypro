<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, HasRoles, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'password',
        'role',
        'avatar',
        'locale',
        'is_active',
        'wallet_balance',
        'google_id',
        'email_verified_at',
        'phone_verified_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    // Append avatar_url so it's always included in API responses
    protected $appends = ['avatar_url'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'phone_verified_at' => 'datetime',
            'password'          => 'hashed',
            'is_active'         => 'boolean',
            'wallet_balance'    => 'decimal:2',
        ];
    }

    /**
     * Full public URL for the avatar, or null if not set.
     * Handles storage paths like "avatars/file.jpg" → APP_URL/storage/avatars/file.jpg
     */
    public function getAvatarUrlAttribute(): ?string
    {
        if (!$this->avatar) return null;
        // Already a full URL (e.g. Google OAuth avatar)
        if (str_starts_with($this->avatar, 'http')) return $this->avatar;
        // Local storage path
        return rtrim(config('app.url'), '/') . '/storage/' . ltrim($this->avatar, '/');
    }


    // ─── Relationships ───

    public function tutorProfile()
    {
        return $this->hasOne(TutorProfile::class);
    }

    public function studentProfile()
    {
        return $this->hasOne(StudentProfile::class);
    }

    public function children()
    {
        return $this->hasManyThrough(
            StudentProfile::class,
            User::class,
            'id',
            'parent_user_id',
            'id',
            'id'
        );
    }

    public function walletTransactions()
    {
        return $this->hasMany(WalletTransaction::class);
    }

    public function groupSessions()
    {
        return $this->hasMany(GroupSession::class, 'tutor_id');
    }

    public function groupEnrollments()
    {
        return $this->hasMany(GroupEnrollment::class, 'student_id');
    }

    // ─── Helpers ───

    public function isTutor(): bool
    {
        return $this->role === 'tutor';
    }

    public function isStudent(): bool
    {
        return $this->role === 'student';
    }

    public function isParent(): bool
    {
        return $this->role === 'parent';
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    // ─── Scopes ───

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeByRole($query, string $role)
    {
        return $query->where('role', $role);
    }
}
