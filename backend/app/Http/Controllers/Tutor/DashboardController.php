<?php

namespace App\Http\Controllers\Tutor;

use App\Http\Controllers\Controller;
use App\Models\BookingRequest;
use App\Models\Review;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class DashboardController extends Controller
{
    public function stats(Request $request): JsonResponse
    {
        $user    = $request->user();
        $profile = $user->tutorProfile;

        if (!$profile) {
            return $this->success($this->emptyStats());
        }

        $tutorId = $user->id;

        // ─── Booking counts ──────────────────────────────────────────────────
        $pendingCount   = BookingRequest::where('tutor_id', $tutorId)->pending()->count();
        $activeCount    = BookingRequest::where('tutor_id', $tutorId)->byStatus('accepted')->count();
        $completedCount = BookingRequest::where('tutor_id', $tutorId)->byStatus('completed')->count();
        $totalCount     = BookingRequest::where('tutor_id', $tutorId)->count();

        // ─── Upcoming sessions (accepted + in the future, next 5) ────────────
        $upcomingSessions = BookingRequest::where('tutor_id', $tutorId)
            ->byStatus('accepted')
            ->where(function ($q) {
                $q->where('preferred_date', '>', now()->toDateString())
                  ->orWhere(function ($q2) {
                      $q2->where('preferred_date', now()->toDateString())
                         ->where('preferred_time', '>', now()->format('H:i'));
                  });
            })
            ->orderBy('preferred_date')
            ->orderBy('preferred_time')
            ->limit(5)
            ->with(['student', 'subject'])
            ->get()
            ->map(fn ($b) => [
                'id'             => $b->id,
                'student_name'   => $b->student?->name ?? '—',
                'student_avatar' => $b->student?->avatar,
                'subject_ar'     => $b->subject?->name_ar ?? '—',
                'subject_en'     => $b->subject?->name_en ?? '—',
                // Prefer the confirmed date (agreed in chat); fall back to preferred
                'date'           => $b->confirmed_date
                    ? Carbon::parse($b->confirmed_date)->toDateString()
                    : ($b->preferred_date ? Carbon::parse($b->preferred_date)->toDateString() : null),
                'time'           => $b->confirmed_time ?? $b->preferred_time,
                'type'           => 'private',
                'notes'          => $b->notes,
            ]);

        // ─── Recent reviews (last 3) ─────────────────────────────────────────
        $recentReviews = Review::where('tutor_id', $tutorId)
            ->published()
            ->orderByDesc('created_at')
            ->limit(3)
            ->with('student:id,name,avatar')
            ->get()
            ->map(fn ($r) => [
                'id'            => $r->id,
                'student_name'  => $r->student?->name  ?? '—',
                'student_avatar'=> $r->student?->avatar,
                'rating'        => $r->rating,
                'comment'       => $r->comment,
                'date'          => $r->created_at?->toDateString(),
            ]);

        // ─── Response & acceptance rates ─────────────────────────────────────
        $responded  = BookingRequest::where('tutor_id', $tutorId)->whereIn('status', ['accepted', 'rejected'])->count();
        $responseRate   = $totalCount > 0 ? round(($responded / $totalCount) * 100) : 0;
        $acceptanceRate = $responded  > 0 ? round(($activeCount + $completedCount) / max($responded, 1) * 100) : 0;

        // ─── Search visibility ───────────────────────────────────────────────
        $isSearchable = $profile->onboarding_status === 'approved'
                     && $profile->verification_status === 'verified';

        return $this->success([
            // Core counts
            'total_students'      => $profile->total_students ?? 0,
            'total_reviews'       => $profile->total_reviews  ?? 0,
            'avg_rating'          => $profile->avg_rating     ? round((float) $profile->avg_rating, 1) : null,
            'pending_bookings'    => $pendingCount,
            'active_bookings'     => $activeCount,
            'completed_bookings'  => $completedCount,
            'total_bookings'      => $totalCount,

            // Visibility
            'onboarding_status'   => $profile->onboarding_status,
            'verification_status' => $profile->verification_status ?? 'unverified',
            'is_searchable'       => $isSearchable,

            // Metrics
            'response_rate'       => $responseRate,
            'acceptance_rate'     => $acceptanceRate,
            'subjects_count'      => $profile->tutorSubjects()->count(),
            'availability_slots'  => $profile->availabilities()->count(),

            // Rich data
            'upcoming_sessions'   => $upcomingSessions,
            'recent_reviews'      => $recentReviews,

            // Onboarding
            'onboarding'          => $this->buildOnboardingStatus($profile),
        ]);
    }

    // ─── Onboarding Status Endpoint ─────────────────────────────────────────

    public function onboardingStatus(Request $request): JsonResponse
    {
        $profile = $request->user()->tutorProfile;
        return $this->success($this->buildOnboardingStatus($profile));
    }

    // ─── Helpers ────────────────────────────────────────────────────────────

    private function emptyStats(): array
    {
        return [
            'total_students' => 0, 'total_reviews' => 0, 'avg_rating' => null,
            'pending_bookings' => 0, 'active_bookings' => 0, 'completed_bookings' => 0,
            'total_bookings' => 0, 'onboarding_status' => 'draft',
            'verification_status' => 'unverified', 'is_searchable' => false,
            'response_rate' => 0, 'acceptance_rate' => 0,
            'subjects_count' => 0, 'availability_slots' => 0,
            'upcoming_sessions' => [], 'recent_reviews' => [],
            'onboarding' => $this->buildOnboardingStatus(null),
        ];
    }

    private function buildOnboardingStatus($profile): array
    {
        if (!$profile) {
            return [
                'status' => 'draft', 'current_step' => 0, 'completion_pct' => 0,
                'completed_steps' => array_fill(0, 7, false),
                'missing' => ['account','subjects','profile','format','pricing','documents','availability'],
                'resume_url' => '/auth/tutor-register',
            ];
        }

        $documents    = $profile->documents()->pluck('type')->toArray();
        $requiredDocs = ['national_id_front', 'national_id_back', 'criminal_record'];

        $steps = [
            0 => true,
            1 => $profile->tutorSubjects()->count() >= 1,
            2 => !empty($profile->headline_ar) || !empty($profile->headline_en),
            3 => !empty($profile->lesson_format_details),
            4 => (float) $profile->hourly_rate > 0,
            5 => count(array_intersect($requiredDocs, $documents)) >= 3,
            6 => $profile->availabilities()->count() >= 3,
        ];

        $done = count(array_filter($steps));
        $pct  = (int) round(($done / 7) * 100);

        $names   = ['account','subjects','profile','format','pricing','documents','availability'];
        $missing = [];
        foreach ($steps as $i => $isDone) {
            if (!$isDone) $missing[] = $names[$i];
        }

        return [
            'status'          => $profile->onboarding_status,
            'current_step'    => $profile->onboarding_step,
            'completion_pct'  => $pct,
            'completed_steps' => $steps,
            'missing'         => $missing,
            'resume_url'      => '/auth/tutor-register',
        ];
    }
}
