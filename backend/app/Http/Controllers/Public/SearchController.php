<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\SubjectCategory;
use App\Models\TutorProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    public function tutors(Request $request): JsonResponse
    {
        $query = TutorProfile::query()
            ->with(['user:id,name,avatar', 'governorate', 'city', 'neighborhood', 'subjects'])
            ->whereHas('user', fn ($q) => $q->where('is_active', true))
            ->approved();  // onboarding_status = 'approved' — admin cleared them to be listed


        // ── Free-text search (name, headline, subjects) ──
        if ($request->filled('q')) {
            $q = $request->q;
            $query->where(function ($or) use ($q) {
                $or->whereHas('user', fn ($u) => $u->where('name', 'like', "%{$q}%"))
                   ->orWhere('headline_ar', 'like', "%{$q}%")
                   ->orWhere('headline_en', 'like', "%{$q}%")
                   ->orWhereHas('subjects', fn ($s) =>
                        $s->where('name_ar', 'like', "%{$q}%")
                          ->orWhere('name_en', 'like', "%{$q}%")
                          ->orWhere('slug', 'like', "%{$q}%")
                   );
            });
        }

        // ── Filter by subject (slug or numeric ID) ──
        if ($request->filled('subject')) {
            $subjectParam = $request->subject;
            $query->whereHas('subjects', function ($q) use ($subjectParam) {
                if (is_numeric($subjectParam)) {
                    $q->where('subjects.id', $subjectParam)
                      ->orWhere('subjects.slug', $subjectParam);
                } else {
                    // Slug-only match — never cast a string to bigint
                    $q->where('subjects.slug', $subjectParam);
                }
            });
        }

        // ── Filter by category slug ──
        if ($request->filled('category')) {
            $query->whereHas('subjects', function ($q) use ($request) {
                $q->whereHas('category', fn ($cq) => $cq->where('slug', $request->category));
            });
        }

        // ── Filter by education level ──
        // subjects.levels is a JSON array; qualify table to avoid ambiguity with tutor_subjects join.
        if ($request->filled('level')) {
            $lvl = $request->level;
            $query->whereHas('subjects', function ($q) use ($lvl) {
                $q->whereJsonContains('subjects.levels', $lvl);
            });
        }

        // ── Location filters ──
        $query->byLocation(
            $request->input('governorate'),
            $request->input('city'),
            $request->input('neighborhood')
        );

        // ── Price range ──
        if ($request->filled('price')) {
            $range = $request->price;
            if ($range === '350+') {
                $query->where('hourly_rate', '>=', 350);
            } elseif (str_contains($range, '-')) {
                [$min, $max] = explode('-', $range);
                $query->byPriceRange((float)$min, (float)$max);
            }
        } else {
            $query->byPriceRange(
                $request->input('min_price'),
                $request->input('max_price')
            );
        }

        // ── Lesson format ──
        $query->byFormat($request->input('format'));

        // ── Free trial ──
        if ($request->filled('is_first_lesson_free') || $request->boolean('free_trial')) {
            $query->where('is_first_lesson_free', true);
        }

        // ── Sorting ──
        $sort = $request->input('sort', 'top_rated');
        $query = match ($sort) {
            'lowest_price', 'price_asc'   => $query->orderBy('hourly_rate', 'asc'),
            'highest_price', 'price_desc' => $query->orderBy('hourly_rate', 'desc'),
            'most_reviews', 'reviews'     => $query->orderBy('total_reviews', 'desc'),
            'newest'                      => $query->orderBy('created_at', 'desc'),
            default                       => $query->orderBy('is_featured', 'desc')->orderBy('avg_rating', 'desc'),
        };

        $tutors = $query->paginate($request->input('per_page', 12));

        return $this->success($tutors);
    }

    /**
     * Return all subject categories with their subjects for filter dropdowns.
     */
    public function categories(): JsonResponse
    {
        $categories = SubjectCategory::with(['subjects' => fn ($q) =>
            $q->where('is_active', true)->orderBy('name_en')
        ])->orderBy('sort_order')->get();

        return $this->success($categories);
    }
}
