<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Subject extends Model
{
    protected $fillable = [
        'category_id',
        'name_ar',
        'name_en',
        'slug',
        'icon',
        'is_active',
        'synonyms',
        'search_keywords',
        'levels',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'synonyms'  => 'array',
            'levels'    => 'array',
        ];
    }

    // ─── Relationships ───

    public function category()
    {
        return $this->belongsTo(SubjectCategory::class, 'category_id');
    }

    public function tutorProfiles()
    {
        return $this->belongsToMany(TutorProfile::class, 'tutor_subjects')
            ->withPivot(['proficiency_level', 'levels', 'hourly_rate'])
            ->withTimestamps();
    }

    // ─── Scopes ───

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Fuzzy-search subjects by matching against:
     * - name_en (LIKE)
     * - name_ar (LIKE)
     * - synonyms JSON (LIKE on raw JSON)
     * - search_keywords (LIKE)
     */
    public function scopeSearch($query, string $term)
    {
        $like = '%' . $term . '%';
        return $query->where(function ($q) use ($like) {
            $q->where('name_en', 'like', $like)
              ->orWhere('name_ar', 'like', $like)
              ->orWhere('synonyms', 'like', $like)
              ->orWhere('search_keywords', 'like', $like);
        });
    }

    // ─── Helpers ───

    public function name(string $locale = 'ar'): string
    {
        return $locale === 'ar' ? $this->name_ar : $this->name_en;
    }
}
