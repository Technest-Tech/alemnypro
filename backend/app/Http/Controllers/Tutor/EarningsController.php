<?php

namespace App\Http\Controllers\Tutor;

use App\Http\Controllers\Controller;
use App\Models\Session;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class EarningsController extends Controller
{
    // ─── GET /tutor/earnings ─────────────────────────────────────────────────

    public function index(Request $request): JsonResponse
    {
        $user    = $request->user();
        $tutorId = $user->id;

        // Current month totals
        $now   = Carbon::now();
        $month = Session::forTutor($tutorId)
            ->completed()
            ->whereMonth('completed_at', $now->month)
            ->whereYear('completed_at',  $now->year)
            ->selectRaw('
                SUM(gross_amount)  AS total_gross,
                SUM(platform_fee)  AS total_fees,
                SUM(tutor_payout)  AS total_net,
                COUNT(*)           AS session_count
            ')
            ->first();

        // All-time totals
        $allTime = Session::forTutor($tutorId)->completed()
            ->selectRaw('SUM(gross_amount) AS total_gross, SUM(platform_fee) AS total_fees, SUM(tutor_payout) AS total_net, COUNT(*) AS session_count')
            ->first();

        // Pending sessions (completed but payout not yet released)
        $pending = Session::forTutor($tutorId)
            ->completed()
            ->whereNull('payout_released_at')
            ->selectRaw('SUM(tutor_payout) AS pending_payout, COUNT(*) AS pending_count')
            ->first();

        // Monthly breakdown — last 6 months
        $monthly = Session::forTutor($tutorId)
            ->completed()
            ->where('completed_at', '>=', $now->copy()->subMonths(5)->startOfMonth())
            ->selectRaw("DATE_FORMAT(completed_at, '%Y-%m') AS month, SUM(tutor_payout) AS net, COUNT(*) AS sessions")
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        return $this->success([
            'month' => [
                'gross'         => (float) ($month->total_gross  ?? 0),
                'fees'          => (float) ($month->total_fees   ?? 0),
                'net'           => (float) ($month->total_net    ?? 0),
                'session_count' => (int)   ($month->session_count ?? 0),
            ],
            'all_time' => [
                'gross'         => (float) ($allTime->total_gross  ?? 0),
                'fees'          => (float) ($allTime->total_fees   ?? 0),
                'net'           => (float) ($allTime->total_net    ?? 0),
                'session_count' => (int)   ($allTime->session_count ?? 0),
            ],
            'pending_payout'  => (float) ($pending->pending_payout  ?? 0),
            'pending_sessions'=> (int)   ($pending->pending_count   ?? 0),
            'monthly_breakdown' => $monthly,
        ]);
    }

    // ─── GET /tutor/earnings/invoices ────────────────────────────────────────

    public function invoices(Request $request): JsonResponse
    {
        $tutorId = $request->user()->id;

        $sessions = Session::forTutor($tutorId)
            ->completed()
            ->with(['student', 'subject', 'booking'])
            ->orderByDesc('completed_at')
            ->paginate(20);

        $items = $sessions->getCollection()->map(fn ($s) => [
            'id'             => $s->id,
            'session_number' => $s->session_number,
            'student_name'   => $s->student?->name ?? '—',
            'subject'        => $s->subject?->name_ar ?? $s->booking?->subject ?? '—',
            'date'           => $s->completed_at?->toDateString(),
            'duration_min'   => $s->duration_minutes,
            'gross'          => (float) $s->gross_amount,
            'fee_pct'        => (float) $s->platform_fee_pct,
            'fee'            => (float) $s->platform_fee,
            'net'            => (float) $s->tutor_payout,
            'payout_released'=> ! is_null($s->payout_released_at),
        ]);

        return $this->success([
            'data'       => $items,
            'pagination' => [
                'current_page' => $sessions->currentPage(),
                'last_page'    => $sessions->lastPage(),
                'total'        => $sessions->total(),
            ],
        ]);
    }

    // ─── POST /tutor/payout-preferences ─────────────────────────────────────

    public function savePayoutPreference(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'method'         => ['required', Rule::in(['vodafone_cash', 'instapay', 'bank_transfer'])],
            'account_number' => ['required', 'string', 'max:255'],
            'account_name'   => ['nullable', 'string', 'max:255'],
        ]);

        $tutorId = $request->user()->id;

        // Check minimum pending payout before allowing preference save
        // (We allow saving preference even before 200 EGP, just for setup)

        DB::table('tutor_payout_preferences')->updateOrInsert(
            ['tutor_id' => $tutorId, 'method' => $validated['method']],
            [
                'account_number' => $validated['account_number'],
                'account_name'   => $validated['account_name'] ?? null,
                'is_default'     => true,
                'status'         => 'active',
                'updated_at'     => now(),
                'created_at'     => now(),
            ]
        );

        return $this->success(['message' => 'Payout preference saved successfully.']);
    }

    // ─── GET /tutor/payout-preferences ──────────────────────────────────────

    public function getPayoutPreferences(Request $request): JsonResponse
    {
        $prefs = DB::table('tutor_payout_preferences')
            ->where('tutor_id', $request->user()->id)
            ->get();

        return $this->success($prefs);
    }
}
