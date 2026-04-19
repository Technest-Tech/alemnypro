<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BookingRequest;
use App\Models\User;
use App\Models\TutorProfile;
use App\Models\VerificationDocument;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DashboardController extends Controller
{
    // ─── GET /admin/dashboard/stats ──────────────────────────────

    public function stats(): JsonResponse
    {
        $now      = Carbon::now();
        $weekAgo  = $now->copy()->subWeek();
        $monthAgo = $now->copy()->subMonth();

        // Current totals
        $totalUsers    = User::count();
        $totalTutors   = User::byRole('tutor')->count();
        $totalStudents = User::byRole('student')->count();

        // Week-over-week trends (new signups)
        $newUsersThisWeek  = User::where('created_at', '>=', $weekAgo)->count();
        $newUsersPrevWeek  = User::whereBetween('created_at', [$weekAgo->copy()->subWeek(), $weekAgo])->count();

        $newTutorsThisWeek = User::byRole('tutor')->where('created_at', '>=', $weekAgo)->count();
        $newTutorsPrevWeek = User::byRole('tutor')->whereBetween('created_at', [$weekAgo->copy()->subWeek(), $weekAgo])->count();

        // Sessions / financial snapshot
        $sessionStats = DB::table('lesson_sessions')
            ->selectRaw("
                COUNT(*) AS total_sessions,
                COUNT(CASE WHEN status = 'confirmed' THEN 1 END) AS confirmed_sessions,
                COUNT(CASE WHEN status = 'disputed'  THEN 1 END) AS disputed_sessions,
                COUNT(CASE WHEN status = 'scheduled' THEN 1 END) AS scheduled_sessions,
                COALESCE(SUM(CASE WHEN status = 'confirmed' THEN gross_amount END), 0) AS total_revenue,
                COALESCE(SUM(CASE WHEN status = 'confirmed' THEN platform_fee END), 0) AS total_commission,
                COALESCE(SUM(CASE WHEN status = 'confirmed' THEN tutor_payout END), 0) AS total_payouts,
                COALESCE(SUM(CASE WHEN status IN ('scheduled','completed','disputed') THEN gross_amount END), 0) AS escrow_amount
            ")
            ->first();

        // Revenue this week vs last week
        $revenueThisWeek = (float) DB::table('lesson_sessions')
            ->where('status', 'confirmed')
            ->where('updated_at', '>=', $weekAgo)
            ->sum('gross_amount');

        $revenuePrevWeek = (float) DB::table('lesson_sessions')
            ->where('status', 'confirmed')
            ->whereBetween('updated_at', [$weekAgo->copy()->subWeek(), $weekAgo])
            ->sum('gross_amount');

        // Open disputes amount
        $openDisputesAmount = (float) DB::table('lesson_sessions')
            ->join('session_disputes', 'lesson_sessions.id', '=', 'session_disputes.session_id')
            ->where('session_disputes.status', 'open')
            ->sum('lesson_sessions.gross_amount');

        return $this->success([
            // === User Stats ===
            'total_users'           => $totalUsers,
            'total_tutors'          => $totalTutors,
            'total_students'        => $totalStudents,
            'verified_tutors'       => TutorProfile::verified()->count(),
            'pending_verifications' => VerificationDocument::pending()->count(),
            'total_bookings'        => BookingRequest::count(),
            'pending_bookings'      => BookingRequest::pending()->count(),
            'completed_bookings'    => BookingRequest::byStatus('completed')->count(),

            // === Trend Deltas ===
            'new_users_this_week'   => $newUsersThisWeek,
            'new_users_prev_week'   => $newUsersPrevWeek,
            'new_tutors_this_week'  => $newTutorsThisWeek,
            'new_tutors_prev_week'  => $newTutorsPrevWeek,

            // === Financial ===
            'total_revenue'         => (float) ($sessionStats->total_revenue    ?? 0),
            'total_commission'      => (float) ($sessionStats->total_commission  ?? 0),
            'total_payouts'         => (float) ($sessionStats->total_payouts     ?? 0),
            'escrow_amount'         => (float) ($sessionStats->escrow_amount     ?? 0),
            'open_disputes_amount'  => $openDisputesAmount,
            'revenue_this_week'     => $revenueThisWeek,
            'revenue_prev_week'     => $revenuePrevWeek,

            // === Session Counts ===
            'total_sessions'        => (int) ($sessionStats->total_sessions     ?? 0),
            'confirmed_sessions'    => (int) ($sessionStats->confirmed_sessions  ?? 0),
            'disputed_sessions'     => (int) ($sessionStats->disputed_sessions   ?? 0),
            'scheduled_sessions'    => (int) ($sessionStats->scheduled_sessions  ?? 0),
        ]);
    }

    // ─── GET /admin/dashboard/chart ─────────────────────────────
    // Returns last 30 days of revenue + new users per day

    public function chart(): JsonResponse
    {
        $days   = 30;
        $start  = Carbon::now()->subDays($days - 1)->startOfDay();
        $labels = [];

        for ($i = 0; $i < $days; $i++) {
            $labels[] = $start->copy()->addDays($i)->format('Y-m-d');
        }

        // Revenue per day (confirmed sessions by updated_at date)
        $revenueRows = DB::table('lesson_sessions')
            ->where('status', 'confirmed')
            ->where('updated_at', '>=', $start)
            ->selectRaw("DATE(updated_at) AS day, SUM(gross_amount) AS revenue, SUM(platform_fee) AS commission")
            ->groupBy('day')
            ->get()
            ->keyBy('day');

        // New user signups per day
        $userRows = DB::table('users')
            ->where('created_at', '>=', $start)
            ->selectRaw("DATE(created_at) AS day, COUNT(*) AS count")
            ->groupBy('day')
            ->get()
            ->keyBy('day');

        // New sessions per day
        $sessionRows = DB::table('lesson_sessions')
            ->where('created_at', '>=', $start)
            ->selectRaw("DATE(created_at) AS day, COUNT(*) AS count")
            ->groupBy('day')
            ->get()
            ->keyBy('day');

        $chart = array_map(function ($label) use ($revenueRows, $userRows, $sessionRows) {
            return [
                'date'       => $label,
                'label'      => Carbon::parse($label)->format('M d'),
                'revenue'    => (float) ($revenueRows[$label]->revenue    ?? 0),
                'commission' => (float) ($revenueRows[$label]->commission ?? 0),
                'users'      => (int)   ($userRows[$label]->count         ?? 0),
                'sessions'   => (int)   ($sessionRows[$label]->count      ?? 0),
            ];
        }, $labels);

        return $this->success($chart);
    }
}
