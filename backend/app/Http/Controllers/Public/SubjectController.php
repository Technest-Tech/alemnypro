<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Subject;
use App\Models\SubjectCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SubjectController extends Controller
{
    public function index(): JsonResponse
    {
        $subjects = Subject::with('category')
            ->active()
            ->withCount('tutorProfiles')
            ->orderBy('name_en')
            ->get();

        return $this->success($subjects);
    }

    public function byCategory(string $categorySlug): JsonResponse
    {
        $subjects = Subject::active()
            ->whereHas('category', fn ($q) => $q->where('slug', $categorySlug))
            ->withCount('tutorProfiles')
            ->orderBy('name_en')
            ->get();

        return $this->success($subjects);
    }

    /**
     * Smart fuzzy search for the Subject Discovery Engine.
     * Searches name_en, name_ar, synonyms JSON, and search_keywords.
     * Returns results grouped by category (max 15 total).
     */
    public function search(Request $request): JsonResponse
    {
        $q = trim($request->get('q', ''));

        if (strlen($q) < 2) {
            // Return most popular subjects when query is too short
            $subjects = Subject::with('category')
                ->active()
                ->withCount('tutorProfiles')
                ->orderByDesc('tutor_profiles_count')
                ->limit(8)
                ->get();
            return $this->success($this->formatGrouped($subjects));
        }

        $subjects = Subject::with('category')
            ->active()
            ->search($q)
            ->withCount('tutorProfiles')
            ->orderByDesc('tutor_profiles_count')
            ->limit(15)
            ->get();

        return $this->success($this->formatGrouped($subjects));
    }

    private function formatGrouped($subjects): array
    {
        $grouped = [];

        foreach ($subjects as $subject) {
            $catName = $subject->category->name_en ?? 'Other';
            $catSlug = $subject->category->slug ?? 'other';

            if (!isset($grouped[$catSlug])) {
                $grouped[$catSlug] = [
                    'category_name_en' => $catName,
                    'category_name_ar' => $subject->category->name_ar ?? '',
                    'category_slug'    => $catSlug,
                    'subjects'         => [],
                ];
            }

            $grouped[$catSlug]['subjects'][] = [
                'id'                 => $subject->id,
                'name_en'            => $subject->name_en,
                'name_ar'            => $subject->name_ar,
                'slug'               => $subject->slug,
                'icon'               => $subject->icon,
                'tutor_count'        => $subject->tutor_profiles_count,
                'synonyms'           => $subject->synonyms ?? [],
            ];
        }

        return array_values($grouped);
    }
}
