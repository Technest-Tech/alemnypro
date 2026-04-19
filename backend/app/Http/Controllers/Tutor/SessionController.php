<?php

namespace App\Http\Controllers\Tutor;

use App\Http\Controllers\Controller;
use App\Models\BookingRequest;
use App\Models\Session;
use App\Models\PlatformSetting;
use App\Services\WhatsAppService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class SessionController extends Controller
{
    public function __construct(
        private readonly WhatsAppService $whatsApp
    ) {}

    // ─── GET /tutor/sessions ──────────────────────────────────────

    public function index(Request $request): JsonResponse
    {
        $tutor    = $request->user();
        $statuses = $request->input('status')
            ? explode(',', $request->input('status'))
            : ['scheduled', 'completed', 'disputed', 'confirmed', 'cancelled'];

        $sessions = Session::with(['student', 'subject', 'booking', 'dispute'])
            ->forTutor($tutor->id)
            ->whereIn('status', $statuses)
            ->orderBy('scheduled_at', 'asc')
            ->paginate(20);

        return response()->json([
            'success' => true,
            'data'    => $sessions,
        ]);
    }

    // ─── POST /tutor/bookings/{id}/sessions ──────────────────────

    public function store(Request $request, int $bookingId): JsonResponse
    {
        $tutor   = $request->user();
        $booking = BookingRequest::with(['student', 'subject'])
            ->where('tutor_id', $tutor->id)
            ->findOrFail($bookingId);

        // Validations
        if (! $booking->isPaid()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot schedule sessions — booking has not been paid yet.',
            ], 422);
        }

        $request->validate([
            'sessions'                      => 'required|array|min:1',
            'sessions.*.scheduled_at'       => 'required|date|after:now',
            'sessions.*.duration_minutes'   => 'nullable|integer|min:' . PlatformSetting::getValue('min_session_duration', 30)
                                                                . '|max:' . PlatformSetting::getValue('max_session_duration', 180),
            'sessions.*.meeting_link'       => 'nullable|url',
        ]);

        $incoming   = $request->input('sessions');
        $newCount   = count($incoming);
        $remaining  = $booking->remainingSessions();

        if ($newCount > $remaining) {
            return response()->json([
                'success' => false,
                'message' => "Cannot schedule {$newCount} sessions. Only {$remaining} remaining in this booking.",
            ], 422);
        }

        // Snapshot financials
        $financials = Session::calculateFinancials((float) $booking->per_lesson_amount ?? (float) $booking->hourly_rate);

        $created = DB::transaction(function () use ($booking, $incoming, $financials, $tutor) {
            $nextNumber = $booking->sessions_scheduled + 1;
            $sessions   = [];

            foreach ($incoming as $data) {
                $session = Session::create([
                    'booking_request_id' => $booking->id,
                    'tutor_id'           => $booking->tutor_id,
                    'student_id'         => $booking->student_id,
                    'subject_id'         => $booking->subject_id,
                    'session_number'     => $nextNumber++,
                    'scheduled_at'       => $data['scheduled_at'],
                    'duration_minutes'   => $data['duration_minutes'] ?? 60,
                    'lesson_format'      => $booking->lesson_format,
                    'meeting_link'       => $data['meeting_link'] ?? null,
                    'status'             => 'scheduled',
                    ...$financials,
                ]);
                $sessions[] = $session;
            }

            // Update sessions_scheduled count on booking
            $booking->increment('sessions_scheduled', count($incoming));

            return $sessions;
        });

        // WhatsApp notification to student
        $firstSession = Carbon::parse($created[0]->scheduled_at)->format('l d M Y — H:i');
        $student      = $booking->student;
        $tutorProfile = $tutor->tutorProfile;

        if ($student->phone) {
            $this->whatsApp->notifyStudentSessionsScheduled(
                studentPhone: $student->phone,
                studentName:  $student->name,
                tutorName:    $tutor->name,
                subjectName:  $booking->subject->name_ar ?? $booking->subject->name_en,
                sessionCount: count($created),
                firstSessionDate: $firstSession,
            );
        }

        return response()->json([
            'success'  => true,
            'message'  => count($created) . ' session(s) scheduled successfully.',
            'data'     => $created,
        ], 201);
    }

    // ─── GET /tutor/sessions/{id} ─────────────────────────────────

    public function show(Request $request, int $id): JsonResponse
    {
        $session = Session::with(['student', 'subject', 'booking', 'dispute.raisedBy'])
            ->forTutor($request->user()->id)
            ->findOrFail($id);

        return response()->json(['success' => true, 'data' => $session]);
    }

    // ─── PUT /tutor/sessions/{id} ─────────────────────────────────

    public function update(Request $request, int $id): JsonResponse
    {
        $session = Session::forTutor($request->user()->id)->findOrFail($id);

        if (! in_array($session->status, ['scheduled', 'completed'])) {
            return response()->json([
                'success' => false,
                'message' => 'Only scheduled or completed sessions can be updated.',
            ], 422);
        }

        $request->validate([
            'scheduled_at'     => 'sometimes|date|after:now',
            'meeting_link'     => 'nullable|url',
            'recording_link'   => 'nullable|url',
            'tutor_notes'      => 'nullable|string|max:1000',
            'duration_minutes' => 'sometimes|integer|min:15|max:240',
        ]);

        $session->update($request->only([
            'scheduled_at',
            'meeting_link',
            'recording_link',
            'tutor_notes',
            'duration_minutes',
        ]));

        return response()->json(['success' => true, 'data' => $session->fresh()]);
    }

    // ─── POST /tutor/sessions/{id}/complete ───────────────────────

    public function complete(Request $request, int $id): JsonResponse
    {
        $session = Session::with(['student', 'subject', 'tutor'])
            ->forTutor($request->user()->id)
            ->findOrFail($id);

        if (! $session->canBeMarkedComplete()) {
            return response()->json([
                'success' => false,
                'message' => 'Only scheduled sessions can be marked as complete.',
            ], 422);
        }

        $request->validate([
            'recording_link' => 'required|url',
            'tutor_notes'    => 'nullable|string|max:1000',
        ]);

        $disputeHours = (int) PlatformSetting::getValue('dispute_window_hours', 48);

        $session->update([
            'status'               => 'completed',
            'completed_at'         => now(),
            'dispute_window_ends'  => now()->addHours($disputeHours),
            'recording_link'       => $request->input('recording_link'),
            'tutor_notes'          => $request->input('tutor_notes'),
        ]);

        // WhatsApp notification to student
        $student = $session->student;
        if ($student->phone) {
            $this->whatsApp->notifyStudentSessionCompleted(
                studentPhone:      $student->phone,
                studentName:       $student->name,
                subjectName:       $session->subject->name_ar ?? $session->subject->name_en,
                tutorName:         $session->tutor->name,
                disputeWindowHours: $disputeHours,
                recordingLink:     $session->recording_link,
            );
        }

        return response()->json([
            'success' => true,
            'message' => "Session marked complete. Student has {$disputeHours}h to dispute.",
            'data'    => $session->fresh(),
        ]);
    }

    // ─── PUT /tutor/sessions/{id}/cancel ─────────────────────────

    public function cancel(Request $request, int $id): JsonResponse
    {
        $session = Session::forTutor($request->user()->id)->findOrFail($id);

        if (! $session->canBeCancelled()) {
            return response()->json([
                'success' => false,
                'message' => 'Only scheduled sessions can be cancelled.',
            ], 422);
        }

        $request->validate([
            'reason' => 'required|string|min:10|max:500',
        ]);

        $session->update([
            'status'           => 'cancelled',
            'cancelled_reason' => $request->input('reason'),
        ]);

        // Decrement sessions_scheduled on booking
        $session->booking->decrement('sessions_scheduled');

        return response()->json([
            'success' => true,
            'message' => 'Session cancelled.',
            'data'    => $session->fresh(),
        ]);
    }
}
