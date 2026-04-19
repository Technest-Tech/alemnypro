<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StudentProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'curriculum',
        'grade_level',
        'parent_user_id',
    ];

    // ─── Relationships ───

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function parent()
    {
        return $this->belongsTo(User::class, 'parent_user_id');
    }

    public function bookingRequests()
    {
        return $this->hasMany(BookingRequest::class, 'student_id', 'user_id');
    }
}
