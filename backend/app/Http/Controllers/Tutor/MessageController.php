<?php

namespace App\Http\Controllers\Tutor;

use App\Http\Controllers\Controller;
use App\Models\BookingRequest;
use App\Models\ConversationMessage;
use App\Models\Session;
use App\Services\WhatsAppService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;


class MessageController extends Controller
{
    public function __construct(
        private readonly WhatsAppService $whatsApp
    ) {}

    private function frontendUrl(string $path): string
    {
        return config('app.frontend_url', 'http://localhost:3000') . $path;
    }

    // ─── GET /tutor/conversations ─────────────────────────────────
    /**
     * List all booking conversations for the tutor
     * (most recent message first, includes unread count per conversation)
     */
    public function index(Request $request): JsonResponse
    {
        $tutorId = $request->user()->id;

        $bookings = BookingRequest::where('tutor_id', $tutorId)
            ->with([
                'student:id,name,avatar,phone,email',
                'subject:id,name_ar,name_en',
                'messages' => fn ($q) => $q->latest()->limit(1),
            ])
            ->orderBy('updated_at', 'desc')
            ->get()
            ->map(function (BookingRequest $booking) use ($tutorId) {
                $lastMessage = $booking->messages->first();
                $unreadCount = ConversationMessage::where('booking_request_id', $booking->id)
                    ->where('is_read', false)
                    ->where('sender_id', '!=', $tutorId)
                    ->count();

                return [
                    'booking_id'    => $booking->id,
                    'status'        => $booking->status,
                    'lesson_type'   => $booking->lesson_type,
                    'payment_status'=> $booking->payment_status,
                    'student'       => $booking->student,
                    'subject'       => $booking->subject,
                    'last_message'  => $lastMessage ? [
                        'type'       => $lastMessage->type,
                        'body'       => $lastMessage->body,
                        'created_at' => $lastMessage->created_at,
                    ] : null,
                    'unread_count'  => $unreadCount,
                    'created_at'    => $booking->created_at,
                ];
            });

        return $this->success($bookings);
    }

    // ─── GET /tutor/conversations/{id}/messages ───────────────────
    public function messages(Request $request, int $id): JsonResponse
    {
        $booking = BookingRequest::where('tutor_id', $request->user()->id)
            ->with(['student:id,name,avatar,phone,email', 'subject:id,name_ar,name_en'])
            ->findOrFail($id);

        $messages = ConversationMessage::where('booking_request_id', $id)
            ->with('sender:id,name,avatar,role')
            ->orderBy('created_at')
            ->get();

        // Mark messages from student as read
        ConversationMessage::where('booking_request_id', $id)
            ->where('sender_id', '!=', $request->user()->id)
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return $this->success([
            'booking'  => $booking,
            'messages' => $messages,
        ]);
    }

    // ─── POST /tutor/conversations/{id}/messages ──────────────────
    public function send(Request $request, int $id): JsonResponse
    {
        $request->validate(['body' => ['required', 'string', 'max:2000']]);

        $tutor = $request->user();
        $booking = BookingRequest::where('tutor_id', $tutor->id)
            ->with(['student', 'subject'])
            ->findOrFail($id);

        $message = ConversationMessage::create([
            'booking_request_id' => $booking->id,
            'sender_id'          => $tutor->id,
            'type'               => 'text',
            'body'               => $request->body,
        ]);

        $booking->touch();

        // WhatsApp notification to student
        $student = $booking->student;
        if ($student?->phone) {
            $this->whatsApp->notifyNewChatMessage(
                recipientPhone: $student->phone,
                recipientName : $student->name,
                senderName    : $tutor->name,
                messagePreview: mb_substr($request->body, 0, 100),
                dashboardUrl  : $this->frontendUrl('/dashboard/student/messages')
            );
        }

        return $this->created($message->load('sender:id,name,avatar,role'));
    }

    // ─── POST /tutor/conversations/{id}/accept ────────────────────
    public function accept(Request $request, int $id): JsonResponse
    {
        $tutor = $request->user();
        $booking = BookingRequest::where('tutor_id', $tutor->id)
            ->where('status', 'pending')
            ->with(['student', 'subject', 'tutorProfile'])
            ->findOrFail($id);

        DB::transaction(function () use ($booking, $tutor) {
            $booking->update(['status' => 'accepted']);

            // Create booking_accepted message
            ConversationMessage::create([
                'booking_request_id' => $booking->id,
                'sender_id'          => $tutor->id,
                'type'               => 'booking_accepted',
                'body'               => null,
            ]);

            // Create contact_shared message with tutor contact details
            ConversationMessage::create([
                'booking_request_id' => $booking->id,
                'sender_id'          => $tutor->id,
                'type'               => 'contact_shared',
                'body'               => null,
                'metadata'           => [
                    'phone'    => $tutor->phone,
                    'email'    => $tutor->email,
                    'whatsapp' => $tutor->phone,
                    'name'     => $tutor->name,
                ],
            ]);
        });

        $booking->touch();

        // WhatsApp notification to student
        $student = $booking->student;
        if ($student?->phone) {
            $this->whatsApp->notifyStudentBookingAcceptedChat(
                studentPhone: $student->phone,
                studentName : $student->name,
                tutorName   : $tutor->name,
                subjectName : $booking->subject->name_ar ?? $booking->subject->name_en,
                dashboardUrl: $this->frontendUrl('/dashboard/student/messages')
            );
        }

        return $this->success(['booking_id' => $booking->id], 'تم قبول الطلب بنجاح');
    }

    // ─── POST /tutor/conversations/{id}/reject ────────────────────
    public function reject(Request $request, int $id): JsonResponse
    {
        $request->validate(['reason' => ['nullable', 'string', 'max:500']]);

        $tutor = $request->user();
        $booking = BookingRequest::where('tutor_id', $tutor->id)
            ->where('status', 'pending')
            ->with(['student', 'subject'])
            ->findOrFail($id);

        DB::transaction(function () use ($booking, $tutor, $request) {
            $booking->update(['status' => 'rejected']);

            ConversationMessage::create([
                'booking_request_id' => $booking->id,
                'sender_id'          => $tutor->id,
                'type'               => 'booking_rejected',
                'body'               => $request->reason,
            ]);
        });

        $booking->touch();

        // WhatsApp notification to student
        $student = $booking->student;
        if ($student?->phone) {
            $this->whatsApp->notifyStudentBookingRejected(
                studentPhone: $student->phone,
                studentName : $student->name,
                tutorName   : $tutor->name,
                subjectName : $booking->subject->name_ar ?? $booking->subject->name_en,
                dashboardUrl: $this->frontendUrl('/dashboard/student/messages')
            );
        }

        return $this->success(null, 'تم رفض الطلب');
    }

    // ─── POST /tutor/conversations/{id}/propose-date ──────────────
    public function proposeDate(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'proposed_date' => ['required', 'date', 'after_or_equal:today'],
            'proposed_time' => ['required', 'date_format:H:i'],
        ]);

        $tutor = $request->user();
        $booking = BookingRequest::where('tutor_id', $tutor->id)
            ->whereIn('status', ['accepted'])
            ->with(['student', 'subject'])
            ->findOrFail($id);

        $message = ConversationMessage::create([
            'booking_request_id' => $booking->id,
            'sender_id'          => $tutor->id,
            'type'               => 'date_proposal',
            'body'               => null,
            'metadata'           => [
                'proposed_date' => $request->proposed_date,
                'proposed_time' => $request->proposed_time,
                'proposed_by'   => 'tutor',
            ],
        ]);

        $booking->touch();

        // WhatsApp notification to student
        $student = $booking->student;
        if ($student?->phone) {
            $this->whatsApp->notifyDateProposal(
                recipientPhone: $student->phone,
                recipientName : $student->name,
                proposerName  : $tutor->name,
                proposedDate  : $request->proposed_date,
                proposedTime  : $request->proposed_time,
                dashboardUrl  : $this->frontendUrl('/dashboard/student/messages')
            );
        }

        return $this->created($message->load('sender:id,name,avatar'));
    }

    // ─── POST /tutor/conversations/{id}/confirm-date ──────────────
    public function confirmDate(Request $request, int $id): JsonResponse
    {
        $tutor = $request->user();
        $booking = BookingRequest::where('tutor_id', $tutor->id)
            ->with(['student', 'subject', 'messages' => fn ($q) => $q->where('type', 'date_proposal')->latest()])
            ->findOrFail($id);

        // Find the last date proposal from student
        $proposal = $booking->messages->first();
        if (! $proposal || $proposal->metadata['proposed_by'] !== 'student') {
            return response()->json(['success' => false, 'message' => 'No student date proposal found to confirm.'], 422);
        }

        $date = $proposal->metadata['proposed_date'];
        $time = $proposal->metadata['proposed_time'];

        DB::transaction(function () use ($booking, $tutor, $date, $time) {
            // Save confirmed date on booking
            $booking->update(['confirmed_date' => $date, 'confirmed_time' => $time]);

            // Post the system message
            ConversationMessage::create([
                'booking_request_id' => $booking->id,
                'sender_id'          => $tutor->id,
                'type'               => 'date_confirmed',
                'body'               => null,
                'metadata'           => ['confirmed_date' => $date, 'confirmed_time' => $time],
            ]);

            // ─── Auto-create Session record ──────────────────────────────
            // Don't create if a session already exists for this booking at this date
            $alreadyExists = Session::where('booking_request_id', $booking->id)
                ->where('status', '!=', 'cancelled')
                ->exists();

            if (! $alreadyExists) {
                $scheduledAt = Carbon::parse("{$date} {$time}");

                // Financials: 0 for trial / unset bookings, real amount once lesson type is set
                $grossAmount = (float) ($booking->per_lesson_amount ?? $booking->hourly_rate ?? 0);
                $financials  = $grossAmount > 0
                    ? Session::calculateFinancials($grossAmount)
                    : ['gross_amount' => 0, 'platform_fee_pct' => 0, 'platform_fee' => 0, 'tutor_payout' => 0];

                $nextNumber = $booking->sessions_scheduled + 1;

                Session::create([
                    'booking_request_id' => $booking->id,
                    'tutor_id'           => $booking->tutor_id,
                    'student_id'         => $booking->student_id,
                    'subject_id'         => $booking->subject_id,
                    'session_number'     => $nextNumber,
                    'scheduled_at'       => $scheduledAt,
                    'duration_minutes'   => 60,
                    'lesson_format'      => $booking->lesson_format ?? 'online',
                    'status'             => 'scheduled',
                    ...$financials,
                ]);

                $booking->increment('sessions_scheduled');
            }
        });

        $booking->touch();

        // WhatsApp to student
        $student = $booking->student;
        if ($student?->phone) {
            $this->whatsApp->notifyDateConfirmed(
                recipientPhone: $student->phone,
                recipientName : $student->name,
                confirmedDate : $date,
                confirmedTime : $time,
                dashboardUrl  : $this->frontendUrl('/dashboard/student/messages')
            );
        }

        return $this->success(null, 'تم تأكيد الموعد');
    }

    // ─── POST /tutor/conversations/{id}/set-lesson-type ──────────
    public function setLessonType(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'lesson_type'   => ['required', 'in:trial,lessons'],
            'lessons_count' => ['required_if:lesson_type,lessons', 'integer', 'min:1', 'max:100'],
            'hourly_rate'   => ['nullable', 'numeric', 'min:0'],
        ]);

        $tutor = $request->user();
        $booking = BookingRequest::where('tutor_id', $tutor->id)
            ->with(['student', 'subject'])
            ->findOrFail($id);

        $lessonType   = $request->lesson_type;
        $lessonsCount = $lessonType === 'lessons' ? $request->lessons_count : 1;
        $rate         = $request->hourly_rate ?? $booking->hourly_rate;
        $total        = $lessonType === 'lessons' ? round($rate * $lessonsCount, 2) : 0;

        DB::transaction(function () use ($booking, $tutor, $lessonType, $lessonsCount, $rate, $total, $request) {
            $booking->update([
                'lesson_type'       => $lessonType,
                'lessons_count'     => $lessonsCount,
                'hourly_rate'       => $rate,
                'per_lesson_amount' => $lessonType === 'lessons' ? $rate : 0,
                'total_amount'      => $total,
            ]);

            ConversationMessage::create([
                'booking_request_id' => $booking->id,
                'sender_id'          => $tutor->id,
                'type'               => 'lesson_type_set',
                'body'               => null,
                'metadata'           => [
                    'lesson_type'       => $lessonType,
                    'lessons_count'     => $lessonsCount,
                    'per_lesson_amount' => $rate,
                    'total_amount'      => $total,
                ],
            ]);
        });

        $booking->touch();

        return $this->success(['lesson_type' => $lessonType, 'total' => $total]);
    }

    // ─── POST /tutor/conversations/{id}/generate-payment-link ─────
    public function generatePaymentLink(Request $request, int $id): JsonResponse
    {
        $tutor = $request->user();
        $booking = BookingRequest::where('tutor_id', $tutor->id)
            ->where('lesson_type', 'lessons')
            ->with(['student', 'subject'])
            ->findOrFail($id);

        if ($booking->payment_status === 'paid') {
            return response()->json(['success' => false, 'message' => 'This booking has already been paid.'], 422);
        }

        $token      = $booking->generatePaymentToken();
        $paymentUrl = $this->frontendUrl("/pay/{$token}");
        $total      = (float) $booking->total_amount;

        ConversationMessage::create([
            'booking_request_id' => $booking->id,
            'sender_id'          => $tutor->id,
            'type'               => 'payment_link',
            'body'               => null,
            'metadata'           => [
                'token'         => $token,
                'payment_url'   => $paymentUrl,
                'amount'        => $total,
                'lessons_count' => $booking->lessons_count,
            ],
        ]);

        $booking->touch();

        // WhatsApp to student
        $student = $booking->student;
        if ($student?->phone) {
            $this->whatsApp->notifyStudentPaymentLink(
                studentPhone: $student->phone,
                studentName : $student->name,
                tutorName   : $tutor->name,
                subjectName : $booking->subject->name_ar ?? $booking->subject->name_en,
                totalAmount : $total,
                lessonsCount: $booking->lessons_count,
                paymentUrl  : $paymentUrl
            );
        }

        return $this->success(['payment_url' => $paymentUrl]);
    }

    // ─── POST /tutor/conversations/{id}/mark-read ─────────────────
    public function markRead(Request $request, int $id): JsonResponse
    {
        $tutorId = $request->user()->id;
        BookingRequest::where('tutor_id', $tutorId)->findOrFail($id);

        ConversationMessage::where('booking_request_id', $id)
            ->where('sender_id', '!=', $tutorId)
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return $this->success(null, 'Marked as read');
    }
}
