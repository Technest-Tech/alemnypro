<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Session;
use App\Models\SessionDispute;
use App\Services\PaymentService;
use App\Services\WhatsAppService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DisputeController extends Controller
{
    public function __construct(
        private readonly PaymentService  $paymentService,
        private readonly WhatsAppService $whatsApp
    ) {}

    // ─── GET /admin/disputes ─────────────────────────────────────

    public function index(Request $request): JsonResponse
    {
        $status = $request->input('status', 'open');

        $disputes = SessionDispute::with([
            'session.tutor',
            'session.student',
            'session.subject',
            'raisedBy',
            'resolvedBy',
        ])
        ->when($status !== 'all', fn ($q) => $q->where('status', $status))
        ->orderBy('created_at', 'desc')
        ->paginate(20);

        return response()->json(['success' => true, 'data' => $disputes]);
    }

    // ─── GET /admin/disputes/{id} ────────────────────────────────

    public function show(int $id): JsonResponse
    {
        $dispute = SessionDispute::with([
            'session.tutor.tutorProfile',
            'session.student',
            'session.subject',
            'session.booking',
            'raisedBy',
            'resolvedBy',
        ])->findOrFail($id);

        return response()->json(['success' => true, 'data' => $dispute]);
    }

    // ─── PUT /admin/disputes/{id}/resolve ────────────────────────

    public function resolve(Request $request, int $id): JsonResponse
    {
        $admin   = $request->user();
        $dispute = SessionDispute::with(['session.tutor', 'session.student', 'session.subject'])
            ->findOrFail($id);

        if (! $dispute->isOpen()) {
            return response()->json([
                'success' => false,
                'message' => 'This dispute has already been resolved.',
            ], 422);
        }

        $request->validate([
            'resolution' => 'required|in:tutor,student',
            'admin_note' => 'required|string|min:10|max:2000',
        ]);

        $resolution = $request->input('resolution');
        $session    = $dispute->session;

        DB::transaction(function () use ($dispute, $session, $resolution, $admin, $request) {
            $disputeStatus = $resolution === 'tutor' ? 'resolved_tutor' : 'resolved_student';

            $dispute->update([
                'status'      => $disputeStatus,
                'admin_note'  => $request->input('admin_note'),
                'resolved_by' => $admin->id,
                'resolved_at' => now(),
            ]);

            if ($resolution === 'tutor') {
                // Tutor wins → confirm session → release payout
                $session->update(['status' => 'confirmed', 'confirmed_at' => now()]);
                $this->paymentService->releaseSessionPayout($session);
            } else {
                // Student wins → mark confirmed (no payout) → refund student
                $session->update([
                    'status'             => 'confirmed',
                    'confirmed_at'       => now(),
                    'payout_released_at' => now(), // mark so cron skips it
                ]);
                $this->paymentService->refundStudentForSession($session);
            }
        });

        // Notify both parties via WhatsApp
        $session->refresh()->load(['tutor', 'student', 'subject']);
        $subjectName = $session->subject->name_ar ?? $session->subject->name_en;

        if ($session->tutor->phone) {
            $this->whatsApp->notifyDisputeResolved($session->tutor->phone, $session->tutor->name, $subjectName, $resolution, 'tutor');
        }
        if ($session->student->phone) {
            $this->whatsApp->notifyDisputeResolved($session->student->phone, $session->student->name, $subjectName, $resolution, 'student');
        }

        return response()->json([
            'success' => true,
            'message' => "Dispute resolved in favor of {$resolution}.",
            'data'    => $dispute->fresh(),
        ]);
    }
}
