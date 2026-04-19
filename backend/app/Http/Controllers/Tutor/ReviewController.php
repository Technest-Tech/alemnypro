<?php

namespace App\Http\Controllers\Tutor;

use App\Http\Controllers\Controller;
use App\Models\Review;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    /**
     * GET /tutor/reviews
     *
     * Returns the authenticated tutor's reviews with:
     *  - Paginated review cards (15 per page)
     *  - Full distribution breakdown (1–5 stars)
     *  - Aggregate avg + total
     */
    public function index(Request $request): JsonResponse
    {
        $tutorId = $request->user()->id;

        // ─── Aggregate stats ────────────────────
        $stats = Review::published()
            ->forTutor($tutorId)
            ->selectRaw('
                COUNT(*)                                            AS total,
                ROUND(AVG(rating::numeric), 2)                     AS avg_rating,
                COUNT(*) FILTER (WHERE rating = 5)                 AS five_star,
                COUNT(*) FILTER (WHERE rating = 4)                 AS four_star,
                COUNT(*) FILTER (WHERE rating = 3)                 AS three_star,
                COUNT(*) FILTER (WHERE rating = 2)                 AS two_star,
                COUNT(*) FILTER (WHERE rating = 1)                 AS one_star
            ')
            ->first();


        $total = (int) ($stats->total ?? 0);
        $avg   = $total > 0 ? round((float) $stats->avg_rating, 1) : null;

        $distribution = [];
        $starKeys = [5 => 'five_star', 4 => 'four_star', 3 => 'three_star', 2 => 'two_star', 1 => 'one_star'];
        foreach ($starKeys as $stars => $col) {
            $count = (int) ($stats->$col ?? 0);
            $distribution[] = [
                'stars' => $stars,
                'count' => $count,
                'pct'   => $total > 0 ? round(($count / $total) * 100) : 0,
            ];
        }

        // ─── Paginated reviews ──────────────────
        $perPage = (int) $request->query('per_page', 10);
        $perPage = max(5, min(50, $perPage));

        $reviews = Review::published()
            ->forTutor($tutorId)
            ->with('student:id,name,avatar')
            ->orderByDesc('created_at')
            ->paginate($perPage);

        $items = $reviews->map(fn ($r) => [
            'id'           => $r->id,
            'student_name' => $r->student?->name  ?? '—',
            'student_avatar'=> $r->student?->avatar,
            'booking_id'   => $r->booking_id,
            'rating'       => $r->rating,
            'comment'      => $r->comment,
            'date'         => $r->created_at?->toDateString(),
        ]);

        return $this->success([
            'stats' => [
                'total'        => $total,
                'avg_rating'   => $avg,
                'distribution' => $distribution,
            ],
            'reviews' => [
                'data'          => $items,
                'current_page'  => $reviews->currentPage(),
                'last_page'     => $reviews->lastPage(),
                'per_page'      => $reviews->perPage(),
                'total'         => $reviews->total(),
            ],
        ]);
    }
}
