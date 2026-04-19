<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\GroupSession;
use App\Models\GroupEnrollment;
use App\Services\GroupSessionService;
use Illuminate\Http\Request;
use Exception;

class GroupSessionController extends Controller
{
    public function __construct(protected GroupSessionService $groupSessionService) {}

    public function index(Request $request)
    {
        $enrollments = $request->user()->groupEnrollments()
            ->with('groupSession.tutor', 'groupSession.subject')
            ->orderBy('enrolled_at', 'desc')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $enrollments
        ]);
    }

    public function enroll(Request $request, $id)
    {
        $session = GroupSession::findOrFail($id);

        try {
            $enrollment = $this->groupSessionService->enrollStudent($session, $request->user());
            return response()->json([
                'status' => 'success',
                'message' => 'Successfully enrolled in group session',
                'data' => $enrollment
            ], 201);
        } catch (Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 400);
        }
    }

    public function cancel(Request $request, $id)
    {
        $enrollment = $request->user()->groupEnrollments()->findOrFail($id);

        // Can only cancel if session is not yet confirmed 
        // In a real system, there are more nuanced rules (e.g. 24h before)
        $session = $enrollment->groupSession;
        if ($session->status !== 'open') {
            return response()->json([
                'status' => 'error', 
                'message' => 'Cannot cancel enrollment because the session is already confirmed or completed.'
            ], 400);
        }

        // Technically we need a cancelEnrollment service method. For MVP lets just do it here:
        \DB::transaction(function () use ($enrollment, $session) {
            $enrollment->update(['status' => 'cancelled', 'cancelled_at' => now(), 'payment_status' => 'refunded']);
            if ($enrollment->amount_paid > 0) {
                app(\App\Services\WalletService::class)->refund(
                    $enrollment->student,
                    $enrollment->amount_paid,
                    $enrollment,
                    "Refund for voluntary student cancellation: " . $session->title_en,
                    "استرداد لإلغاء الطالب: " . $session->title_ar
                );
            }
        });

        return response()->json([
            'status' => 'success',
            'message' => 'Enrollment cancelled and funds refunded.'
        ]);
    }
}
