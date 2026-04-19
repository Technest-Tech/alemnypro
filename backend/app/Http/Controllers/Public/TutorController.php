<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\TutorProfile;
use Illuminate\Http\JsonResponse;

class TutorController extends Controller
{
    public function featured(): JsonResponse
    {
        $tutors = TutorProfile::with(['user:id,name,avatar', 'governorate', 'city', 'subjects'])
            ->verified()
            ->featured()
            ->whereHas('user', fn ($q) => $q->where('is_active', true))
            ->orderBy('avg_rating', 'desc')
            ->limit(8)
            ->get();

        return $this->success($tutors);
    }

    public function show(string $slug): JsonResponse
    {
        // Note: verified() scope intentionally removed — tutors need to preview their
        // own profile before verification is complete. Active user check is sufficient.
        $tutor = TutorProfile::with([
            'user:id,name,avatar,created_at',
            'governorate',
            'city',
            'neighborhood',
            'subjects.category',
            'availabilities' => fn ($q) => $q->active()->orderBy('day_of_week'),
        ])
        ->where('slug', $slug)
        ->whereHas('user', fn ($q) => $q->where('is_active', true))
        ->firstOrFail();

        return $this->success($tutor);
    }
}
