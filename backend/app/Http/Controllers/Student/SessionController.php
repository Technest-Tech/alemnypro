<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Session;
use App\Models\SessionDispute;
use App\Services\WhatsAppService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SessionController extends Controller
{
    public function __construct(
        private readonly WhatsAppService $whatsApp
    ) {}

    // ─── GET /student/sessions ────────────────────────────────────

    public function index(Request $request): JsonResponse
    {
        $student  = $request->user();
        $tab      = $request->input('tab', 'upcoming'); // upcoming | history | all

        $query = Session::with(['tutor', 'subject', 'dispute'])
            ->forStudent($student->id);

        $query = match ($tab) {
            'upcoming' => $query->whereIn('status', ['scheduled', 'completed', 'disputed'])
                                ->orderBy('scheduled_at', 'asc'),
            'history'  => $query->whereIn('status', ['confirmed', 'cancelled'])
                                ->orderBy('confirmed_at', 'desc'),
            default    => $query->orderBy('scheduled_at', 'desc'),
        };

        $sessions = $query->paginate(20)->through(fn ($session) => $this->transformSession($session));

        return response()->json(['success' => true, 'data' => $sessions]);
    }

    // ─── GET /student/sessions/{id} ───────────────────────────────

    public function show(Request $request, int $id): JsonResponse
    {
        $session = Session::with(['tutor.tutorProfile', 'subject', 'booking', 'dispute'])
            ->forStudent($request->user()->id)
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data'    => $this->transformSession($session),
        ]);
    }

    // ─── POST /student/sessions/{id}/dispute ─────────────────────

    public function dispute(Request $request, int $id): JsonResponse
    {
        $student = $request->user();
        $session = Session::with(['tutor', 'subject'])
            ->forStudent($student->id)
            ->findOrFail($id);

        // Must be in completed status and within dispute window
        if ($session->status !== 'completed') {
            return response()->json([
                'success' => false,
                'message' => 'You can only dispute a completed session.',
            ], 422);
        }

        if (! $session->isWithinDisputeWindow()) {
            return response()->json([
                'success' => false,
                'message' => 'The dispute window for this session has closed.',
            ], 422);
        }

        if ($session->dispute()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'A dispute has already been raised for this session.',
            ], 422);
        }

        $request->validate([
            'reason'        => 'required|string|min:20|max:2000',
            'evidence_link' => 'nullable|url',
        ]);

        $dispute = SessionDispute::create([
            'session_id'    => $session->id,
            'raised_by'     => $student->id,
            'reason'        => $request->input('reason'),
            'evidence_link' => $request->input('evidence_link'),
            'status'        => 'open',
        ]);

        // Update session status
        $session->update(['status' => 'disputed']);

        // Notify tutor via WhatsApp
        $tutor = $session->tutor;
        if ($tutor->phone) {
            $this->whatsApp->notifyTutorDisputeRaised(
                tutorPhone:  $tutor->phone,
                tutorName:   $tutor->name,
                subjectName: $session->subject->name_ar ?? $session->subject->name_en,
                studentName: $student->name,
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Dispute submitted. Our team will review and respond within 24-48 hours.',
            'data'    => $dispute,
        ], 201);
    }

    // ─── Transformer ──────────────────────────────────────────────

    private function transformSession(Session $session): array
    {
        $data = $session->toArray();

        // Add computed fields
        $data['is_within_dispute_window']    = $session->isWithinDisputeWindow();
        $data['dispute_window_remaining_h']  = $session->disputeWindowRemainingHours();
        $data['can_dispute']                 = $session->isWithinDisputeWindow() && ! $session->dispute;
        $data['meeting_available']           = ! empty($session->meeting_link)
            && now()->diffInMinutes($session->scheduled_at, false) <= 30;

        return $data;
    }
}
