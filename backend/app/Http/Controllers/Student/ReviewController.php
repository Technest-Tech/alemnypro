<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\BookingRequest;
use App\Models\Review;
use App\Models\TutorProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReviewController extends Controller
{
    /**
     * POST /student/reviews
     *
     * Body: { tutor_id, booking_id (optional), rating (1–5), comment (optional) }
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'tutor_id'   => ['required', 'integer', 'exists:users,id'],
            'booking_id' => ['nullable', 'integer', 'exists:booking_requests,id'],
            'rating'     => ['required', 'integer', 'min:1', 'max:5'],
            'comment'    => ['nullable', 'string', 'max:2000'],
        ]);

        $student = $request->user();

        // ─── Verify booking belongs to this student (if supplied) ───────────
        if (!empty($validated['booking_id'])) {
            $booking = BookingRequest::find($validated['booking_id']);
            if (!$booking || $booking->student_id !== $student->id) {
                return $this->error('Booking not found or does not belong to you.', 403);
            }
        }

        // ─── Check for existing review ──────────────────────────────────────
        $exists = Review::where('tutor_id',  $validated['tutor_id'])
                        ->where('student_id', $student->id)
                        ->where('booking_id', $validated['booking_id'] ?? null)
                        ->exists();

        if ($exists) {
            return $this->error('You have already submitted a review for this booking.', 422);
        }

        // ─── Create review & update denormalized stats ──────────────────────
        $review = DB::transaction(function () use ($validated, $student) {
            $review = Review::create([
                'tutor_id'   => $validated['tutor_id'],
                'student_id' => $student->id,
                'booking_id' => $validated['booking_id'] ?? null,
                'rating'     => $validated['rating'],
                'comment'    => $validated['comment'] ?? null,
                'is_published' => true,
            ]);

            // Update denormalized avg_rating + total_reviews on tutor profile
            $profile = TutorProfile::where('user_id', $validated['tutor_id'])->first();
            if ($profile) {
                $agg = Review::published()
                    ->forTutor($validated['tutor_id'])
                    ->selectRaw('COUNT(*) as total, ROUND(AVG(rating::numeric),2) as avg')
                    ->first();

                $profile->update([
                    'total_reviews' => (int) ($agg->total ?? 0),
                    'avg_rating'    => $agg->avg ?? null,
                ]);
            }

            return $review;
        });

        return $this->created([
            'id'      => $review->id,
            'rating'  => $review->rating,
            'comment' => $review->comment,
            'date'    => $review->created_at->toDateString(),
        ], 'Review submitted successfully.');
    }
}
