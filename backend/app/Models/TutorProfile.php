<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\Sluggable\HasSlug;
use Spatie\Sluggable\SlugOptions;

class TutorProfile extends Model implements HasMedia
{
    use HasFactory, HasSlug, InteractsWithMedia;

    protected $fillable = [
        'user_id',
        'slug',
        // Onboarding state
        'onboarding_step',
        'onboarding_status',
        'rejection_reason',
        // Profile content
        'headline_ar',
        'headline_en',
        'bio_ar',
        'bio_en',
        'bio_method_ar',
        'bio_method_en',
        'experience_years',
        'education',
        'education_level',
        // Pricing
        'hourly_rate',
        'hourly_rate_online',
        'pack_5h_price',
        'pack_10h_price',
        'travel_expenses',
        'currency',
        'group_pricing',
        'is_first_lesson_free',
        'is_first_trial_free',
        'trial_duration_minutes',
        'first_lesson_duration',
        // Location / format
        'lesson_format',
        'lesson_format_details',
        'governorate_id',
        'city_id',
        'neighborhood_id',
        'location_label',
        // Stats
        'verification_status',
        'total_students',
        'total_reviews',
        'avg_rating',
        'is_featured',
        'video_url',
        'is_live',
    ];

    protected function casts(): array
    {
        return [
            'hourly_rate'           => 'decimal:2',
            'hourly_rate_online'    => 'decimal:2',
            'pack_5h_price'         => 'decimal:2',
            'pack_10h_price'        => 'decimal:2',
            'travel_expenses'       => 'decimal:2',
            'avg_rating'            => 'decimal:1',
            'is_first_lesson_free'  => 'boolean',
            'is_first_trial_free'   => 'boolean',
            'is_featured'           => 'boolean',
            'is_live'               => 'boolean',
            'total_students'        => 'integer',
            'total_reviews'         => 'integer',
            'experience_years'      => 'integer',
            'onboarding_step'       => 'integer',
            'trial_duration_minutes'=> 'integer',
            'lesson_format_details' => 'array',
            'group_pricing'         => 'array',
        ];
    }

    // ─── Slug ───

    public function getSlugOptions(): SlugOptions
    {
        return SlugOptions::create()
            ->generateSlugsFrom(fn ($model) => $model->user->name)
            ->saveSlugsTo('slug')
            ->doNotGenerateSlugsOnUpdate();
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    // ─── Media ───

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('avatar')
            ->singleFile()
            ->acceptsMimeTypes(['image/jpeg', 'image/png', 'image/webp']);
    }

    // ─── Relationships ───

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function subjects()
    {
        return $this->belongsToMany(Subject::class, 'tutor_subjects')
            ->withPivot(['proficiency_level', 'levels', 'hourly_rate'])
            ->withTimestamps();
    }

    public function tutorSubjects()
    {
        return $this->hasMany(TutorSubject::class);
    }

    public function documents()
    {
        return $this->hasMany(TutorDocument::class);
    }

    public function governorate()
    {
        return $this->belongsTo(Governorate::class);
    }

    public function city()
    {
        return $this->belongsTo(City::class);
    }

    public function neighborhood()
    {
        return $this->belongsTo(Neighborhood::class);
    }

    public function verificationDocuments()
    {
        return $this->hasMany(VerificationDocument::class);
    }

    public function availabilities()
    {
        return $this->hasMany(TutorAvailability::class);
    }

    public function bookingRequests()
    {
        return $this->hasMany(BookingRequest::class, 'tutor_id');
    }

    // ─── Scopes ───

    public function scopeVerified($query)
    {
        return $query->where('verification_status', 'verified');
    }

    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true);
    }

    public function scopeDraft($query)
    {
        return $query->where('onboarding_status', 'draft');
    }

    public function scopePendingReview($query)
    {
        return $query->where('onboarding_status', 'pending_review');
    }

    public function scopeApproved($query)
    {
        return $query->where('onboarding_status', 'approved');
    }

    public function scopeByLocation($query, ?int $govId, ?int $cityId = null, ?int $neighborhoodId = null)
    {
        return $query
            ->when($govId, fn ($q) => $q->where('governorate_id', $govId))
            ->when($cityId, fn ($q) => $q->where('city_id', $cityId))
            ->when($neighborhoodId, fn ($q) => $q->where('neighborhood_id', $neighborhoodId));
    }

    public function scopeByPriceRange($query, ?float $min, ?float $max)
    {
        return $query
            ->when($min, fn ($q) => $q->where('hourly_rate', '>=', $min))
            ->when($max, fn ($q) => $q->where('hourly_rate', '<=', $max));
    }

    public function scopeByFormat($query, ?string $format)
    {
        if (!$format || $format === 'all') return $query;
        return $query->where(function ($q) use ($format) {
            $q->where('lesson_format', $format)
              ->orWhere('lesson_format', 'both');
        });
    }

    // ─── Helpers ───

    public function isVerified(): bool
    {
        return $this->verification_status === 'verified';
    }

    public function isOnboardingComplete(): bool
    {
        return $this->onboarding_step >= 7;
    }

    public function isDraft(): bool
    {
        return $this->onboarding_status === 'draft';
    }

    public function headline(string $locale = 'ar'): string
    {
        return $locale === 'ar'
            ? ($this->headline_ar ?: $this->headline_en)
            : ($this->headline_en ?: $this->headline_ar);
    }

    public function bio(string $locale = 'ar'): string
    {
        return $locale === 'ar'
            ? ($this->bio_ar ?: $this->bio_en)
            : ($this->bio_en ?: $this->bio_ar);
    }
}
