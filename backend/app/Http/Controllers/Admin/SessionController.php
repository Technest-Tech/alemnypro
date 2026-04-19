<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Session;
use App\Models\SessionDispute;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SessionController extends Controller
{
    // ─── GET /admin/sessions ─────────────────────────────────────

    public function index(Request $request): JsonResponse
    {
        $status  = $request->input('status');
        $tutorId = $request->input('tutor_id');
        $from    = $request->input('from');
        $to      = $request->input('to');

        $sessions = Session::with(['tutor', 'student', 'subject', 'dispute'])
            ->when($status,  fn ($q) => $q->where('status', $status))
            ->when($tutorId, fn ($q) => $q->where('tutor_id', $tutorId))
            ->when($from,    fn ($q) => $q->where('scheduled_at', '>=', $from))
            ->when($to,      fn ($q) => $q->where('scheduled_at', '<=', $to))
            ->orderBy('scheduled_at', 'desc')
            ->paginate(30);

        return response()->json(['success' => true, 'data' => $sessions]);
    }

    // ─── GET /admin/sessions/{id} ─────────────────────────────────

    public function show(int $id): JsonResponse
    {
        $session = Session::with([
            'tutor:id,name,email,phone',
            'student:id,name,email,phone',
            'subject:id,name_ar,name_en',
            'dispute',
            'booking:id,status,lesson_format,notes',
        ])->findOrFail($id);

        return response()->json(['success' => true, 'data' => $session]);
    }

    // ─── GET /admin/sessions/financials ──────────────────────────

    public function financials(): JsonResponse
    {
        $stats = DB::table('sessions')
            ->selectRaw("
                COUNT(*) AS total_sessions,
                COUNT(CASE WHEN status = 'confirmed' THEN 1 END) AS confirmed_sessions,
                COUNT(CASE WHEN status = 'disputed' THEN 1 END) AS disputed_sessions,
                COUNT(CASE WHEN status = 'scheduled' THEN 1 END) AS scheduled_sessions,
                COALESCE(SUM(CASE WHEN status = 'confirmed' THEN gross_amount END), 0) AS total_revenue,
                COALESCE(SUM(CASE WHEN status = 'confirmed' THEN platform_fee END), 0) AS total_commission,
                COALESCE(SUM(CASE WHEN status = 'confirmed' THEN tutor_payout END), 0) AS total_payouts,
                COALESCE(SUM(CASE WHEN status IN ('scheduled','completed','disputed') THEN gross_amount END), 0) AS escrow_amount
            ")
            ->first();

        $openDisputesAmount = DB::table('sessions')
            ->join('session_disputes', 'sessions.id', '=', 'session_disputes.session_id')
            ->where('session_disputes.status', 'open')
            ->sum('sessions.gross_amount');

        return response()->json([
            'success' => true,
            'data'    => [
                'total_sessions'     => (int) $stats->total_sessions,
                'confirmed_sessions' => (int) $stats->confirmed_sessions,
                'disputed_sessions'  => (int) $stats->disputed_sessions,
                'scheduled_sessions' => (int) $stats->scheduled_sessions,
                'total_revenue'      => (float) $stats->total_revenue,
                'total_commission'   => (float) $stats->total_commission,
                'total_payouts'      => (float) $stats->total_payouts,
                'escrow_amount'      => (float) $stats->escrow_amount,
                'open_disputes_amount' => (float) $openDisputesAmount,
            ],
        ]);
    }
}
